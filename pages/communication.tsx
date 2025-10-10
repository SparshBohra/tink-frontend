import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { withAuth } from '../lib/auth-context';
import { apiClient } from '../lib/api';
import { phoneUtils } from '../lib/utils';

interface ChatMessage {
  id: number;
  conversationId: number;
  message: string;
  sent_date: string;
  sender: 'user' | 'tenant';
  status: 'sent' | 'delivered' | 'read';
  phone?: string;
  sid?: string;
  type: 'sms' | 'email';
}

interface Conversation {
  id: number;
  tenantId: number;
  tenantName: string;
  tenantPhone: string;
  tenantUnit: string;
  tenantProperty: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
  status: 'active' | 'archived';
  tenantAvatar?: string;
}

interface SMSTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  variables: string[];
}

interface Tenant {
  id: number;
  name: string;
  phone: string;
  email: string;
  unit: string;
  property: string;
}

function CommunicationPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [messageForm, setMessageForm] = useState({
    recipient: '',
    phone: '',
    subject: '',
    message: '',
    type: 'individual', // individual or broadcast
    messageType: 'sms', // sms or email
    templateId: '',
    selectedTenants: [] as number[]
  });
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  
  // New state for message detection and auto-reload
  const [lastMessageCheck, setLastMessageCheck] = useState<Date>(new Date());
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchTemplates();
    fetchTenants();
  }, []);

  // Page visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto-reload functionality - check for new messages every 5 seconds
  useEffect(() => {
    if (isPageVisible) {
      const interval = setInterval(async () => {
        await checkForNewMessages();
      }, 5000); // Check every 5 seconds

      setPollingInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      // Clear interval when page is not visible
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [isPageVisible, lastMessageCheck]);

  const checkForNewMessages = async () => {
    try {
      console.log('Checking for new messages...');
      
      // Fetch latest conversations to check for new messages
      const conversationsResponse = await apiClient.getConversations();
      const backendConversations = conversationsResponse.results || [];
      
      if (backendConversations.length === 0) {
        return;
      }

      // Check if there are any new messages since our last check
      let hasNewMessages = false;
      let latestMessageTime = lastMessageCheck;

      for (const conv of backendConversations) {
        if (conv.last_message_at) {
          const messageTime = new Date(conv.last_message_at);
          if (messageTime > lastMessageCheck) {
            hasNewMessages = true;
            if (messageTime > latestMessageTime) {
              latestMessageTime = messageTime;
            }
          }
        }
      }

      if (hasNewMessages) {
        console.log('New messages detected, refreshing data...');
        
        // Show auto-refresh indicator
        setIsAutoRefreshing(true);
        
        // Update the last check time
        setLastMessageCheck(latestMessageTime);
        
        // Refresh conversations and current conversation messages
        await fetchMessages(true); // Pass true for isAutoRefresh
        
        // If we have a selected conversation, reload its messages too
        if (selectedConversation) {
          await loadConversationMessages(selectedConversation);
        }
        
        // Hide auto-refresh indicator after a brief delay
        setTimeout(() => {
          setIsAutoRefreshing(false);
        }, 1500);
        
        // Optional: Show a brief notification
        console.log('Communication data refreshed due to new messages');
      }
    } catch (error) {
      console.error('Error checking for new messages:', error);
      // Don't show error to user as this is background polling
    }
  };

  const fetchMessages = async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setLoading(true);
      }
      setError(null);
      console.log('Fetching conversations from backend...');
      
      // Fetch real conversations from backend
      const conversationsResponse = await apiClient.getConversations();
      console.log('Conversations response:', conversationsResponse);
      
      // Transform backend conversations to frontend format
      const backendConversations = conversationsResponse.results || [];
      const transformedConversations = backendConversations.map((conv: any) => ({
        id: conv.id,
        tenantId: conv.tenant,  // This is the tenant ID from the backend
        tenantName: conv.tenant_name || 'Unknown Tenant',
        tenantPhone: conv.tenant_phone || '',
        tenantUnit: 'N/A', // This field doesn't exist in backend - could be added later
        tenantProperty: conv.property_name || 'N/A',
        lastMessage: conv.last_message?.body || conv.subject || 'No messages',
        lastMessageDate: conv.last_message_at || conv.created_at,
        unreadCount: conv.unread_count || 0,
        status: conv.status || 'active',
        tenantAvatar: undefined
      }));
      
      console.log('Transformed conversations:', transformedConversations);
      setConversations(transformedConversations);

      // Update last message check time for auto-reload functionality
      const now = new Date();
      setLastMessageCheck(now);

      // If no conversation is selected and we have conversations, select the first one
      if (!selectedConversation && transformedConversations.length > 0) {
        setSelectedConversation(transformedConversations[0].id);
        loadConversationMessages(transformedConversations[0].id);
      }
    } catch (err: any) {
      console.error('Failed to fetch conversations:', err);
      setError('Failed to load conversations. Using fallback data.');
      
      // Fallback to mock data if API fails
      setConversations([
        {
          id: 1,
          tenantId: 1,
          tenantName: 'John Doe',
          tenantPhone: '+1234567890',
          tenantUnit: 'A101',
          tenantProperty: 'Sunset Apartments',
          lastMessage: 'Thank you for the reminder!',
          lastMessageDate: '2024-01-15T14:30:00Z',
          unreadCount: 0,
          status: 'active'
        }
      ]);
    } finally {
      if (!isAutoRefresh) {
        setLoading(false);
      }
    }
  };

  const loadConversationMessages = async (conversationId: number) => {
    try {
      console.log('Loading messages for conversation:', conversationId);
      
      // Fetch real messages from backend
      const messagesResponse = await apiClient.getMessages();
      console.log('Messages response:', messagesResponse);
      
      // Filter messages for this conversation and transform to frontend format
      const backendMessages = messagesResponse.results || [];
      const conversationMessages = backendMessages
        .filter((msg: any) => msg.conversation === conversationId)
        .map((msg: any) => ({
          id: msg.id,
          conversationId: msg.conversation,
          message: msg.body,
          sent_date: msg.created_at,
          sender: (msg.sender_type === 'manager' ? 'user' : 'tenant') as 'user' | 'tenant',
          status: msg.status || 'sent',
          phone: msg.from_number || msg.to_number,
          sid: msg.twilio_sid || msg.external_message_id,
          type: msg.message_type || 'sms'
        }))
        .sort((a: any, b: any) => new Date(a.sent_date).getTime() - new Date(b.sent_date).getTime());
      
      console.log('Conversation messages:', conversationMessages);
      setMessages(conversationMessages);
    } catch (err: any) {
      console.error('Failed to load conversation messages:', err);
      
      // Fallback to mock messages
      const mockMessages: ChatMessage[] = [
        {
          id: 1,
          conversationId: conversationId,
          message: 'Hi, this is a message from the communication system.',
          sent_date: '2024-01-15T10:00:00Z',
          sender: 'user',
          status: 'read',
          type: 'sms'
        }
      ];
      setMessages(mockMessages);
    }
  };

  const fetchTemplates = async () => {
    try {
      console.log('Fetching templates from backend...');
      
      // Fetch real templates from backend
      const templatesResponse = await apiClient.getMessageTemplates();
      console.log('Templates response:', templatesResponse);
      
      // Transform backend templates to frontend format
      const backendTemplates = templatesResponse.results || [];
      const transformedTemplates = backendTemplates.map((template: any) => ({
        id: template.id,
        name: template.name,
        category: template.category || 'General',
        subject: template.subject || '',
        body: template.body || '',
        variables: template.variables || []
      }));
      
      console.log('Transformed templates:', transformedTemplates);
      setTemplates(transformedTemplates);
    } catch (error: any) {
      console.error('Failed to fetch templates:', error);
      
      // Fallback to empty templates if API fails
      setTemplates([]);
    }
  };

  const fetchTenants = async () => {
    try {
      console.log('Fetching tenants from backend...');
      
      // Fetch real tenants from backend
      const tenantsResponse = await apiClient.getTenants();
      console.log('Tenants response:', tenantsResponse);
      
      // Transform backend tenants to frontend format
      const backendTenants = tenantsResponse.results || [];
      const transformedTenants = backendTenants.map((tenant: any) => ({
        id: tenant.id,
        name: tenant.full_name,
        phone: tenant.phone,
        email: tenant.email,
        unit: tenant.current_room_name || 'N/A',
        property: tenant.current_property_name || 'N/A'
      }));
      
      console.log('Transformed tenants:', transformedTenants);
      setTenants(transformedTenants);
    } catch (error: any) {
      console.error('Failed to fetch tenants:', error);
      
      // Fallback to mock data if API fails
      setTenants([
        { id: 1, name: 'John Doe', phone: '+1234567890', email: 'john@example.com', unit: 'A101', property: 'Sunset Apartments' },
        { id: 2, name: 'Jane Smith', phone: '+1234567891', email: 'jane@example.com', unit: 'B205', property: 'Oak Street Complex' }
      ]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    
    try {
      console.log('Sending message with form data:', messageForm);

      if (messageForm.messageType === 'sms') {
        if (messageForm.type === 'individual') {
          // Find tenant by phone number
          const tenant = tenants.find(t => t.phone === messageForm.phone);
          if (!tenant) {
            throw new Error('Tenant not found for the provided phone number');
          }

          // Use the new communication API for individual messages
          const result = await apiClient.sendMessage({
            tenant_id: tenant.id,
            message_type: 'sms',
            subject: messageForm.subject,
            body: messageForm.message,
            template_id: messageForm.templateId ? parseInt(messageForm.templateId) : undefined
          });

          if (result.success) {
            alert('SMS sent successfully!');
            setShowMessageForm(false);
            setMessageForm({ 
              recipient: '', 
              phone: '',
              subject: '', 
              message: '', 
              type: 'individual',
              messageType: 'sms',
              templateId: '',
              selectedTenants: []
            });
            
            // Refresh conversations to show the new message
            await fetchMessages(true); // Pass true to avoid loading screen
          } else {
            throw new Error(result.error || 'Failed to send SMS');
          }
        } else {
          // For bulk messages, use the old API for now (could be updated later)
          const selectedTenantsList = messageForm.selectedTenants.length > 0 
            ? tenants.filter(t => messageForm.selectedTenants.includes(t.id))
            : tenants;
          
          const payload = {
            message: messageForm.message,
            type: messageForm.type,
            recipients: selectedTenantsList.map(tenant => ({
              name: tenant.name,
              phone: tenant.phone
            }))
          };

          const response = await fetch('/api/sms/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });

          const result = await response.json();
          
          if (result.success) {
            alert(`SMS sent successfully! ${result.summary.successful} of ${result.summary.total} messages delivered.`);
            setShowMessageForm(false);
            setMessageForm({ 
              recipient: '', 
              phone: '',
              subject: '', 
              message: '', 
              type: 'individual',
              messageType: 'sms',
              templateId: '',
              selectedTenants: []
            });
            
            // Refresh conversations
            await fetchMessages(true); // Pass true to avoid loading screen
          } else {
            throw new Error(result.error || 'Failed to send SMS');
          }
        }
      } else {
        // Email functionality - placeholder
        alert('Email functionality not implemented yet');
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert('Failed to send message: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessageForm({
        ...messageForm,
        templateId: templateId,
        subject: template.subject,
        message: template.body
      });
    }
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    setSending(true);
    try {
      const selectedConv = conversations.find(c => c.id === selectedConversation);
      if (!selectedConv) return;

      console.log('Sending message via new communication API...');
      
      // Use the new communication API
      const result = await apiClient.sendMessage({
        tenant_id: selectedConv.tenantId,
        message_type: 'sms',
        body: newMessage
      });
      
      console.log('Send message result:', result);
      
      if (result.success) {
        // Clear the input
        setNewMessage('');
        
        // Refresh conversations and messages to get the latest data
        await fetchMessages(true); // Pass true to avoid loading screen
        
        // Reload the current conversation messages
        await loadConversationMessages(selectedConversation);
        
        console.log('Message sent successfully!');
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert('Failed to send message: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const selectConversation = (conversationId: number) => {
    setSelectedConversation(conversationId);
    loadConversationMessages(conversationId);
    
    // Mark as read
    setConversations(conversations.map(conv => 
      conv.id === conversationId 
        ? { ...conv, unreadCount: 0 }
        : conv
    ));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { style: React.CSSProperties; text: string } } = {
      sent: { 
        style: { background: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, textTransform: 'capitalize', display: 'inline-block' },
        text: 'Sent' 
      },
      delivered: { 
        style: { background: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, textTransform: 'capitalize', display: 'inline-block' },
        text: 'Delivered' 
      },
      read: { 
        style: { background: '#dcfce7', color: '#16a34a', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, textTransform: 'capitalize', display: 'inline-block' },
        text: 'Read' 
      }
    };
    const badge = badges[status.toLowerCase()] || badges.sent;
    return <span style={badge.style}>{badge.text}</span>;
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Communication"
        subtitle="Loading communication data..."
      >
        <LoadingSpinner message="Loading communication..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="">
      <Head>
        <title>Communication - SquareFt</title>
      </Head>
      
      <div className="dashboard-container">
        {/* Modern Title Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}>
          <div style={{
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                backgroundColor: '#7c3aed',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <h1 style={{
                    fontSize: '1.875rem',
                    fontWeight: '700',
                    color: '#111827',
                    margin: 0
                  }}>Communication</h1>
                {isAutoRefreshing && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#dbeafe',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#1d4ed8'
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinning">
                      <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c0 5-4 9-9 9s-9-4-9-9m9 9v-9"/>
                    </svg>
                    New messages detected
                    </div>
                )}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginTop: '0.25rem'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  </svg>
                  Manage tenant communications and announcements
              </div>
            </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <Link 
                href="/communication-log" 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  border: '1px solid #2563eb',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#1d4ed8';
                  e.currentTarget.style.borderColor = '#1d4ed8';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.borderColor = '#2563eb';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <line x1="12" y1="9" x2="8" y2="9"/>
                </svg>
                Communication Log
              </Link>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="error-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}
        
        {/* Chat Interface Layout */}
        <div className="chat-container">
          {/* Main Content Area (Messages) */}
          <div className="main-content">
          {/* Conversations List */}
          <div className="conversations-panel">
            {/* Modern Conversations Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #f1f5f9',
              backgroundColor: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>My Messages</h2>
              <button 
                onClick={() => setShowMessageForm(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#16a34a',
                  border: '1px solid #16a34a',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#15803d';
                  e.currentTarget.style.borderColor = '#15803d';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#16a34a';
                  e.currentTarget.style.borderColor = '#16a34a';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
                Create New
              </button>
            </div>
            
            {/* Modern Search and Filters */}
            <div style={{
              padding: '1rem 1.5rem',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #f1f5f9'
            }}>
              {/* Search Container */}
              <div style={{
                position: 'relative',
                marginBottom: '1rem'
              }}>
                <div style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280',
                  pointerEvents: 'none'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search conversations..."
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '3rem',
                    paddingTop: '0.5rem',
                    paddingBottom: '0.5rem',
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#2563eb';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '0.25rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.color = '#374151';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                  </svg>
                </button>
              </div>
              
              {/* Message Type Filters */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                {['All Types', 'Text Messages', 'Announcements'].map((type, index) => (
                  <button key={type} style={{
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backgroundColor: index === 0 ? '#2563eb' : '#f1f5f9',
                    color: index === 0 ? 'white' : '#6b7280'
                  }}
                  onMouseOver={(e) => {
                    if (index !== 0) {
                      e.currentTarget.style.backgroundColor = '#e2e8f0';
                      e.currentTarget.style.color = '#374151';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (index !== 0) {
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                      e.currentTarget.style.color = '#6b7280';
                    }
                  }}>
                    {type}
                  </button>
                ))}
              </div>
              
              {/* Controls Row */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                {/* Sort Control */}
                <div style={{
                  position: 'relative'
                }}>
                  <select style={{
                    padding: '0.375rem 2rem 0.375rem 0.75rem',
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#374151',
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none'
                  }}>
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="name">Name</option>
                  </select>
                  <div style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: '#6b7280'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6,9 12,15 18,9"/>
                  </svg>
                  </div>
                </div>
                
                {/* Unreads Toggle */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    color: '#6b7280'
                  }}>Unreads</span>
                  <label style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '2.5rem',
                    height: '1.25rem',
                    cursor: 'pointer'
                  }}>
                    <input type="checkbox" style={{
                      opacity: 0,
                      width: 0,
                      height: 0
                    }} />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: '#e2e8f0',
                      borderRadius: '1.25rem',
                      transition: 'all 0.2s ease'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '',
                        height: '1rem',
                        width: '1rem',
                        left: '0.125rem',
                        bottom: '0.125rem',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: 'all 0.2s ease'
                      }}></span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Modern Conversations List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              backgroundColor: 'white'
            }}>
              {conversations.map((conversation) => (
                <div 
                  key={conversation.id} 
                  onClick={() => selectConversation(conversation.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 1.5rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f1f5f9',
                    transition: 'all 0.2s ease',
                    backgroundColor: selectedConversation === conversation.id ? '#f0f9ff' : 'white',
                    borderLeft: selectedConversation === conversation.id ? '3px solid #2563eb' : '3px solid transparent'
                  }}
                  onMouseOver={(e) => {
                    if (selectedConversation !== conversation.id) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedConversation !== conversation.id) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    backgroundColor: '#7c3aed',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'white',
                    flexShrink: 0
                  }}>
                    {conversation.tenantName.split(' ').map(n => n[0]).join('')}
                  </div>
                  
                  {/* Conversation Content */}
                  <div style={{
                    flex: 1,
                    minWidth: 0
                  }}>
                    {/* Header Row */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.25rem'
                    }}>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#111827',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {conversation.tenantName}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        flexShrink: 0,
                        marginLeft: '0.5rem'
                      }}>
                        {new Date(conversation.lastMessageDate).toLocaleDateString()}
                </div>
                  </div>
                    
                    {/* Unit Info */}
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginBottom: '0.25rem'
                    }}>
                      {conversation.tenantUnit} • {conversation.tenantProperty}
                </div>
                    
                    {/* Last Message */}
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {conversation.lastMessage}
              </div>
                  </div>
                  
                  {/* Unread Badge */}
                  {conversation.unreadCount > 0 && (
                    <div style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      borderRadius: '50%',
                      minWidth: '1.25rem',
                      height: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {conversation.unreadCount}
                    </div>
                  )}
                    </div>
              ))}
                </div>
              </div>
              
          {/* Modern Chat Window */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            borderLeft: '1px solid #f1f5f9'
          }}>
            {selectedConversation ? (
              <>
                {/* Modern Chat Header */}
                <div style={{
                  padding: '1.5rem',
                  borderBottom: '1px solid #f1f5f9',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    backgroundColor: '#7c3aed',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'white',
                    flexShrink: 0
                  }}>
                      {conversations.find(c => c.id === selectedConversation)?.tenantName.split(' ').map(n => n[0]).join('')}
                    </div>
                  <div style={{
                    flex: 1
                  }}>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '0.125rem'
                    }}>
                        {conversations.find(c => c.id === selectedConversation)?.tenantName}
                  </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280'
                    }}>
                        {conversations.find(c => c.id === selectedConversation)?.tenantUnit} • {conversations.find(c => c.id === selectedConversation)?.tenantProperty}
                  </div>
                </div>
              </div>

                {/* Modern Messages Area */}
                <div style={{
                  flex: 1,
                  padding: '1.5rem',
                  overflowY: 'auto',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      style={{
                        display: 'flex',
                        justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{
                        maxWidth: '70%',
                        padding: '0.75rem 1rem',
                        borderRadius: '1rem',
                        backgroundColor: message.sender === 'user' ? '#2563eb' : 'white',
                        color: message.sender === 'user' ? 'white' : '#111827',
                        border: message.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        position: 'relative'
                      }}>
                        <div style={{
                          fontSize: '0.875rem',
                          lineHeight: '1.5',
                          marginBottom: '0.5rem'
                        }}>
                        {message.message}
                </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.75rem',
                          opacity: 0.7
                        }}>
                          <span>
                          {new Date(message.sent_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                        {message.sender === 'user' && (
                            <span style={{
                              marginLeft: '0.5rem'
                            }}>
                            {message.status === 'read' && '✓✓'}
                            {message.status === 'delivered' && '✓'}
                            {message.status === 'sent' && '⏱'}
                          </span>
              )}
                        </div>
            </div>
          </div>
                  ))}
              </div>
              
                {/* Message Input */}
                <div style={{
                  padding: '16px',
                  borderTop: '1px solid #e2e8f0',
                  backgroundColor: 'white'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center'
                  }}>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '24px',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      disabled={sending}
                    />
                    <button 
                      style={{
                        width: '40px',
                        height: '40px',
                        background: '#4f46e5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={sendChatMessage}
                      disabled={!newMessage.trim() || sending}
                    >
                      {sending ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3"/>
                    </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="22" y1="2" x2="11" y2="13"/>
                          <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                    </svg>
                      )}
                    </button>
                  </div>
                  </div>
              </>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '40px',
                color: '#64748b'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  marginBottom: '24px',
                  color: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '8px'
                }}>Select a conversation</h3>
                <p style={{
                  fontSize: '14px',
                  marginBottom: '20px'
                }}>Choose a tenant from the list to start messaging</p>
                <button 
                  style={{
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#1d4ed8';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                  }}
                  onClick={() => setShowMessageForm(true)}
                >
                  Start New Conversation
                </button>
                  </div>
            )}
          </div>
          </div>

          {/* Modern Quick Actions Section */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            padding: '1.5rem',
            height: 'fit-content',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          }}>
            {/* Header */}
            <div style={{
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#111827',
                margin: '0 0 0.25rem 0'
              }}>Quick Actions</h2>
              <p style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: 0
              }}>Frequently used actions</p>
              </div>
              
            {/* Actions Grid */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {/* Send Message */}
              <div 
                  onClick={() => setShowMessageForm(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#dbeafe';
                  e.currentTarget.style.borderColor = '#2563eb';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: '#dbeafe',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb'
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 0.125rem 0'
                  }}>Send Message</h3>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    margin: 0
                  }}>Send message to tenants</p>
                  </div>
                </div>

              {/* Templates */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#dcfce7';
                  e.currentTarget.style.borderColor = '#059669';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0fdf4';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: '#d1fae5',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669'
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 0.125rem 0'
                  }}>Templates</h3>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    margin: 0
                  }}>Use message templates</p>
                  </div>
                </div>

              {/* Broadcast */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  backgroundColor: '#fff7ed',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#fed7aa';
                  e.currentTarget.style.borderColor = '#ea580c';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff7ed';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: '#fed7aa',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ea580c'
                }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 0.125rem 0'
                  }}>Broadcast</h3>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    margin: 0
                  }}>Send to all tenants</p>
              </div>
            </div>

              {/* Communication Log */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  backgroundColor: '#faf5ff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#e9d5ff';
                  e.currentTarget.style.borderColor = '#7c3aed';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#faf5ff';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  backgroundColor: '#e9d5ff',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#7c3aed'
                }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                    <line x1="12" y1="9" x2="8" y2="9"/>
                      </svg>
                    </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0 0 0.125rem 0'
                  }}>Communication Log</h3>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    margin: 0
                  }}>View message history</p>
                    </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Form (Modal) */}
        {showMessageForm && (
          <div className="message-form-modal">
            <div className="message-form-section">
              <div className="form-header">
                <h3 className="form-title">Send New Message</h3>
                <p className="form-subtitle">Send message to tenants or broadcast to all</p>
                <button 
                  className="close-btn"
                  onClick={() => setShowMessageForm(false)}
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleSendMessage} className="message-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="messageType" className="form-label">Communication Method</label>
                    <select
                      id="messageType"
                      value={messageForm.messageType}
                      onChange={(e) => setMessageForm({ ...messageForm, messageType: e.target.value })}
                      required
                      className="form-input"
                    >
                      <option value="sms">SMS Text Message</option>
                      <option value="email">Email</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="type" className="form-label">Recipient Type</label>
                    <select
                      id="type"
                      value={messageForm.type}
                      onChange={(e) => setMessageForm({ ...messageForm, type: e.target.value })}
                      required
                      className="form-input"
                    >
                      <option value="individual">Individual Tenant</option>
                      <option value="broadcast">All Tenants</option>
                    </select>
                  </div>

                  {messageForm.type === 'individual' && (
                    <>
                  <div className="form-group">
                        <label htmlFor="recipient" className="form-label">Tenant Name</label>
                        <select
                      id="recipient"
                      value={messageForm.recipient}
                          onChange={(e) => {
                            const selectedTenant = tenants.find(t => t.name === e.target.value);
                            setMessageForm({ 
                              ...messageForm, 
                              recipient: e.target.value,
                              phone: selectedTenant?.phone || ''
                            });
                          }}
                          required
                          className="form-input"
                        >
                          <option value="">Select a tenant...</option>
                          {tenants.map(tenant => (
                            <option key={tenant.id} value={tenant.name}>
                              {tenant.name} - {tenant.unit} ({tenant.property})
                            </option>
                          ))}
                        </select>
                      </div>

                      {messageForm.messageType === 'sms' && (
                        <div className="form-group">
                          <label htmlFor="phone" className="form-label">Phone Number</label>
                          <input
                            type="tel"
                            id="phone"
                            value={messageForm.phone}
                            placeholder="(555) 123-4567"
                            required
                            readOnly
                            className={`form-input readonly ${phoneError ? 'error' : ''}`}
                          />
                          {phoneError && (
                            <div className="field-error">
                              {phoneError}
                            </div>
                          )}
                          {messageForm.phone && !phoneError && (
                            <div className="field-success">
                              ✓ Valid phone number
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {messageForm.type === 'broadcast' && (
                    <div className="form-group full-width">
                      <label className="form-label">Select Tenants (leave empty for all)</label>
                      <div className="tenant-selection">
                        {tenants.map(tenant => (
                          <label key={tenant.id} className="tenant-checkbox">
                            <input
                              type="checkbox"
                              checked={messageForm.selectedTenants.includes(tenant.id)}
                              onChange={(e) => {
                                const updatedTenants = e.target.checked
                                  ? [...messageForm.selectedTenants, tenant.id]
                                  : messageForm.selectedTenants.filter(id => id !== tenant.id);
                                setMessageForm({ ...messageForm, selectedTenants: updatedTenants });
                              }}
                            />
                            <span>{tenant.name} - {tenant.unit}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="form-group full-width">
                    <label htmlFor="template" className="form-label">Use Template (Optional)</label>
                    <select
                      id="template"
                      value={messageForm.templateId}
                      onChange={(e) => handleTemplateSelect(e.target.value)}
                      className="form-input"
                    >
                      <option value="">Select a template...</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name} ({template.category})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {messageForm.messageType === 'email' && (
                    <div className="form-group full-width">
                      <label htmlFor="subject" className="form-label">Subject</label>
                      <input
                        type="text"
                        id="subject"
                        value={messageForm.subject}
                        onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                        placeholder="e.g., Rent Reminder, Maintenance Notice"
                        required
                        className="form-input"
                      />
                    </div>
                  )}

                  <div className="form-group full-width">
                    <label htmlFor="message" className="form-label">
                      Message {messageForm.messageType === 'sms' && '(SMS has 160 character limit)'}
                    </label>
                    <textarea
                      id="message"
                      value={messageForm.message}
                      onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                      rows={messageForm.messageType === 'sms' ? 4 : 6}
                      placeholder="Write your message here... Use {{name}} for tenant name"
                      required
                      className="form-input"
                      maxLength={messageForm.messageType === 'sms' ? 160 : undefined}
                    />
                    {messageForm.messageType === 'sms' && (
                      <div className="character-count">
                        {messageForm.message.length}/160 characters
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowMessageForm(false)}
                    disabled={sending}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={sending}
                  >
                    {sending ? 'Sending...' : `Send ${messageForm.messageType.toUpperCase()}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .dashboard-container {
          width: 100%;
          padding: 16px 20px 20px 20px;
          background: #f8fafc;
          min-height: calc(100vh - 72px);
          box-sizing: border-box;
        }

        /* Custom Header */
        .dashboard-header {
          margin-bottom: 24px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .header-left {
          flex: 1;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .communication-log-btn {
          background: #4f46e5 !important;
          color: white !important;
          border: none !important;
          padding: 10px 16px !important;
          border-radius: 6px !important;
          font-size: 13px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          gap: 8px !important;
          transition: all 0.2s ease !important;
          text-decoration: none !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
        }

        .communication-log-btn:hover {
          background: #3730a3 !important;
          transform: translateY(-1px) !important;
        }

        .communication-log-btn svg {
          stroke: white !important;
          fill: none !important;
        }

        .dashboard-title {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
          line-height: 1.15;
        }

        .subtitle-container {
          min-height: 22px;
        }

        .welcome-message {
          font-size: 14px;
          color: #4b5563;
          margin: 0;
          line-height: 1.45;
        }

        /* Error Banner */
        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 6px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
        }

        /* Chat Interface Layout */
        .chat-container {
          display: grid;
          grid-template-columns: 3fr 1fr;
          gap: 1.5rem;
          height: calc(100vh - 140px);
          background: transparent;
          border-radius: 0;
          border: none;
          overflow: visible;
        }

        /* Main Content Area (Messages) */
        .main-content {
          display: grid;
          grid-template-columns: 350px 1fr;
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        /* Conversations Panel */
        .conversations-panel {
          background: #f8fafc;
          border-right: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
        }

        .conversations-header {
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
        }

        .conversations-title {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .new-chat-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .new-chat-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        /* Conversations Filters */
        .conversations-filters {
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: white;
        }

        .search-container {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
        }

        .search-input {
          flex: 1;
          padding: 8px 12px 8px 36px;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          font-size: 14px;
          background: #f8fafc;
          outline: none;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          border-color: #6366f1;
          background: white;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: #9ca3af;
          pointer-events: none;
        }

        .filter-btn {
          width: 36px;
          height: 36px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #64748b;
        }

        .filter-btn:hover {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }

        .message-type-filters {
          display: flex;
          gap: 8px;
          flex-wrap: nowrap;
          overflow-x: auto;
        }

        .type-filter {
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #64748b;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .type-filter.active {
          background: #4f46e5;
          color: white;
          border-color: #4f46e5;
        }

        .type-filter:hover:not(.active) {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }

        .conversations-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .sort-control {
          position: relative;
          display: flex;
          align-items: center;
        }

        .sort-select {
          appearance: none;
          background: transparent;
          border: none;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          cursor: pointer;
          padding-right: 20px;
          outline: none;
        }

        .sort-arrow {
          position: absolute;
          right: 0;
          color: #64748b;
          pointer-events: none;
        }

        .unreads-toggle {
          display: flex;
          alignItems: 'center';
          gap: 8px;
        }

        .unreads-label {
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          cursor: pointer;
        }

        .toggle-input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #e2e8f0;
          transition: 0.3s;
          border-radius: 24px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        .toggle-input:checked + .toggle-slider {
          background-color: #4f46e5;
        }

        .toggle-input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }

        .conversations-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .conversation-item {
          display: flex;
          alignItems: 'center';
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          margin-bottom: 4px;
        }

        .conversation-item:hover {
          background: #e2e8f0;
        }

        .conversation-item.active {
          background: #4f46e5;
          color: white;
        }

        .conversation-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #4f46e5;
          color: white;
          display: flex;
          alignItems: 'center';
          justifyContent: 'center';
          font-weight: 600;
          font-size: 14px;
          flex-shrink: 0;
        }

        .conversation-item.active .conversation-avatar {
          background: rgba(255, 255, 255, 0.2);
        }

        .conversation-content {
          flex: 1;
          min-width: 0;
        }

        .conversation-header {
          display: flex;
          justifyContent: 'space-between';
          alignItems: 'center';
          margin-bottom: 4px;
        }

        .conversation-name {
          font-weight: 600;
          font-size: 14px;
          color: #1e293b;
          truncate: true;
        }

        .conversation-item.active .conversation-name {
          color: white;
        }

        .conversation-time {
          font-size: 11px;
          color: #64748b;
        }

        .conversation-item.active .conversation-time {
          color: rgba(255, 255, 255, 0.8);
        }

        .conversation-preview {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .conversation-unit {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
        }

        .conversation-item.active .conversation-unit {
          color: rgba(255, 255, 255, 0.8);
        }

        .conversation-last-message {
          font-size: 12px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .conversation-item.active .conversation-last-message {
          color: rgba(255, 255, 255, 0.9);
        }

        .unread-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          alignItems: 'center';
          justifyContent: 'center';
          font-size: 11px;
          font-weight: 600;
        }

        /* Chat Window */
        .chat-window {
          display: flex;
          flex-direction: column;
          background: white;
        }

        .chat-header {
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justifyContent: 'space-between';
          alignItems: 'center';
          background: white;
        }

        .chat-participant {
          display: flex;
          alignItems: 'center';
          gap: 12px;
        }

        .participant-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #4f46e5;
          color: white;
          display: flex;
          alignItems: 'center';
          justifyContent: 'center';
          font-weight: 600;
          font-size: 14px;
        }

        .participant-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .participant-name {
          font-weight: 600;
          font-size: 16px;
          color: #1e293b;
        }

        .participant-details {
          font-size: 12px;
          color: #64748b;
        }

        .chat-actions {
          display: flex;
          gap: 8px;
        }

        .chat-action-btn {
          width: 36px;
          height: 36px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 6px;
          display: flex;
          alignItems: 'center';
          justifyContent: 'center';
          cursor: pointer;
          transition: all 0.2s ease;
          color: #64748b;
        }

        .chat-action-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .message-bubble {
          max-width: 70%;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .message-bubble.sent {
          align-self: flex-end;
          alignItems: flex-end;
        }

        .message-bubble.received {
          align-self: flex-start;
          alignItems: flex-start;
        }

        .message-content {
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.4;
          word-wrap: break-word;
        }

        .message-bubble.sent .message-content {
          background: #4f46e5;
          color: white;
        }

        .message-bubble.received .message-content {
          background: #f1f5f9;
          color: #1e293b;
        }

        .message-meta {
          display: flex;
          alignItems: 'center';
          gap: 6px;
          font-size: 11px;
          color: #64748b;
          padding: 0 4px;
        }

        .message-time {
          font-size: 11px;
          color: #64748b;
        }

        .message-status {
          font-size: 10px;
          color: #64748b;
        }

        .message-status.read {
          color: #10b981;
        }

        .message-status.delivered {
          color: #3b82f6;
        }

        .message-input-area {
          padding: 16px;
          border-top: 1px solid #e2e8f0;
          background: white;
        }

        .message-input-container {
          display: flex;
          gap: 12px;
          alignItems: 'center';
        }

        .message-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
        }

        .message-input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .send-btn {
          width: 40px;
          height: 40px;
          background: #4f46e5;
          color: white;
          border: none;
          border-radius: 50%;
          display: flex;
          alignItems: 'center';
          justifyContent: 'center';
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .send-btn:hover:not(:disabled) {
          background: #3730a3;
          transform: scale(1.05);
        }

        .send-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
          transform: none;
        }

        .no-chat-selected {
          flex: 1;
          display: flex;
          flex-direction: column;
          alignItems: 'center';
          justifyContent: 'center';
          textAlign: 'center';
          padding: 40px;
          color: #64748b;
        }

        .no-chat-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 16px;
          color: #cbd5e1;
        }

        .no-chat-selected h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .no-chat-selected p {
          font-size: 14px;
          margin: 0 0 20px 0;
        }

        .start-new-chat-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .start-new-chat-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        /* Right Sidebar */
        .right-sidebar {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 1.5rem;
          overflow-y: auto;
          height: fit-content;
        }

        /* Section Headers */
        .section-header {
          display: flex;
          justifyContent: 'space-between';
          alignItems: 'flex-start';
          margin-bottom: 12px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 3px 0;
        }

        .section-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        /* Quick Actions Section */
        .quick-actions-section {
          background: white;
          border-radius: 6px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: fit-content;
        }

        .actions-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .action-card {
          display: flex;
          alignItems: 'center';
          gap: 12px;
          padding: 12px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          textDecoration: none;
        }

        .action-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .action-card.blue {
          background: #eff6ff;
          border-color: #dbeafe;
        }

        .action-card.green {
          background: #f0fdf4;
          border-color: #dcfce7;
        }

        .action-card.purple {
          background: #faf5ff;
          border-color: #e9d5ff;
        }

        .action-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          alignItems: 'center';
          justifyContent: 'center';
          flex-shrink: 0;
        }

        .action-card.blue .action-icon {
          background: #3b82f6;
          color: white;
        }

        .action-card.green .action-icon {
          background: #10b981;
          color: white;
        }

        .action-card.purple .action-icon {
          background: #8b5cf6;
          color: white;
        }

        .action-content {
          flex: 1;
        }

        .action-title {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 2px 0;
        }

        .action-subtitle {
          font-size: 11px;
          color: #64748b;
          margin: 0;
        }

        .action-card.orange {
          background: #fff7ed;
          border-color: #fed7aa;
        }

        .action-card.orange .action-icon {
          background: #f97316;
          color: white;
        }


        /* Templates Section */
        .templates-section {
          background: white;
          border-radius: 6px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .templates-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .template-card {
          display: flex;
          alignItems: 'center';
          gap: 12px;
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
          background: white;
          cursor: pointer;
        }
        
        .template-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #cbd5e1;
        }
        
        .template-icon {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          alignItems: 'center';
          justifyContent: 'center';
          flex-shrink: 0;
          background: #eef2ff;
          color: #4f46e5;
        }
        
        .template-content {
          flex: 1;
        }
        
        .template-title {
          font-size: 12px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 2px 0;
        }
        
        .template-description {
          font-size: 10px;
          color: #64748b;
          margin: 0;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .metric-header {
          display: flex;
          justifyContent: 'space-between';
          alignItems: 'flex-start';
          margin-bottom: 12px;
        }

        .metric-info {
          display: flex;
          justifyContent: 'space-between';
          alignItems: 'center';
          width: 100%;
        }

        .metric-title {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          margin: 0;
        }

        .metric-icon {
          width: 20px;
          height: 20px;
          color: #64748b;
        }

        .metric-content {
          margin-top: 8px;
        }

        .metric-value {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 3px;
          line-height: 1;
        }

        .metric-subtitle {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 10px;
        }

        .metric-progress {
          display: flex;
          justifyContent: 'space-between';
          alignItems: 'center';
        }

        .metric-label {
          font-size: 12px;
          color: #64748b;
        }

        .metric-change {
          font-size: 12px;
          font-weight: 600;
        }

        .metric-change.positive {
          color: #10b981;
        }

        /* Section Headers */
        .section-header {
          display: flex;
          justifyContent: 'space-between';
          alignItems: 'flex-start';
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 3px 0;
        }

        .section-subtitle {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .section-actions {
          display: flex;
          gap: 12px;
          alignItems: 'center';
        }

        /* Messages Section */
        .messages-section, 
        .templates-section, 
        .quick-actions-section {
          background: white;
          border-radius: 6px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: fit-content;
        }

        .refresh-btn {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          alignItems: 'center';
          gap: 6px;
          transition: all 0.2s ease;
        }

        .refresh-btn:hover {
          background: #e2e8f0;
          transform: translateY(-1px);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          color: #cbd5e1;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          font-size: 14px;
          margin: 0 0 20px 0;
        }

        .empty-action-btn {
          background: #6366f1;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          textDecoration: none;
          display: inline-block;
          transition: all 0.2s ease;
        }

        .empty-action-btn:hover {
          background: #4f46e5;
          transform: translateY(-1px);
        }

        /* Messages Table */
        .messages-scroll-container {
          overflow-y: auto;
          max-height: 500px;
        }

        .messages-scroll-container::-webkit-scrollbar {
          width: 6px;
        }

        .messages-scroll-container::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.3);
          border-radius: 3px;
        }

        .messages-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }

        .messages-table-container {
          width: 100%;
          overflow-x: auto;
          border-radius: 8px;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .messages-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .messages-table tbody tr {
          transition: background-color 0.2s ease;
        }

        .messages-table tbody tr:hover {
          background-color: #f9fafb;
        }

        .messages-table th {
          position: sticky;
          top: 0;
          background: #ffffff;
          z-index: 2;
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          padding: 12px 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
        }

        .messages-table td {
          padding: 12px 16px;
          vertical-align: middle;
          height: 48px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
          color: #374151;
        }

        .recipient-name {
          color: #1e293b;
        }

        .message-subject {
          color: #374151;
        }
        
        .message-date {
          font-size: 13px;
          color: #334155;
        }

        .date-highlight {
          background-color: #f1f5f9;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          color: #334155;
        }

        .view-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          alignItems: 'center';
          justifyContent: 'center';
          gap: 6px;
          transition: all 0.2s ease;
          textDecoration: none;
          margin: 0 auto;
        }

        .view-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        .view-btn svg {
          stroke: white;
        }

        /* Templates Section */
        .templates-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .template-card {
          display: flex;
          alignItems: 'center';
          gap: 12px;
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
          background: white;
        }
        
        .template-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #cbd5e1;
        }
        
        .template-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          alignItems: 'center';
          justifyContent: 'center';
          flex-shrink: 0;
          background: #eef2ff;
          color: #4f46e5;
        }
        
        .template-content {
          flex: 1;
        }
        
        .template-title {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 2px 0;
        }
        
        .template-description {
          font-size: 11px;
          color: #64748b;
          margin: 0;
        }
        
        /*
        .template-btn {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .template-btn:hover {
          background: #f1f5f9;
        }
        */

        /* Quick Actions Section */
        .actions-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .action-card {
          display: flex;
          alignItems: 'center';
          gap: 12px;
          padding: 10px 12px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          textDecoration: none;
        }

        .action-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .action-card.blue {
          background: #eff6ff;
          border-color: #dbeafe;
        }

        .action-card.green {
          background: #f0fdf4;
          border-color: #dcfce7;
        }

        .action-card.purple {
          background: #faf5ff;
          border-color: #e9d5ff;
        }

        .action-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          alignItems: 'center';
          justifyContent: 'center';
        }

        .action-card.blue .action-icon {
          background: #3b82f6;
          color: white;
        }

        .action-card.green .action-icon {
          background: #10b981;
          color: white;
        }

        .action-card.purple .action-icon {
          background: #8b5cf6;
          color: white;
        }

        .action-content {
          flex: 1;
        }

        .action-title {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 2px 0;
        }

        .action-subtitle {
          font-size: 11px;
          color: #64748b;
          margin: 0;
        }

        /* Utility classes for alignment */
        .table-left { text-align: left !important; }
        .table-right { text-align: right !important; }
        .table-center { text-align: center !important; }

        /* Message Form Modal */
        .message-form-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          alignItems: 'center';
          z-index: 1000;
        }

        .message-form-section {
          background: white;
          width: 90%;
          max-width: 600px;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          position: relative;
        }

        .form-header {
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
        }

        .form-title {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }
        
        .form-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }
        
        .close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 28px;
          line-height: 1;
          color: #9ca3af;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .close-btn:hover {
          color: #1e293b;
        }

        .message-form .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .message-form .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .message-form .form-group.full-width {
          grid-column: 1 / -1;
        }
        
        .message-form .form-label {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .message-form .form-input {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s ease;
          background: white;
        }
        
        .message-form .form-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        
        .message-form .form-input:disabled {
          background: #f9fafb;
          color: #9ca3af;
          cursor: not-allowed;
        }
        
        .message-form .form-input.readonly {
          background: #f8fafc;
          color: #6b7280;
          cursor: default;
          border-color: #e2e8f0;
        }
        
        .message-form .form-input.readonly:focus {
          box-shadow: none;
          border-color: #e2e8f0;
        }

        .message-form .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 24px;
          margin-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .btn {
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          alignItems: 'center';
          justifyContent: 'center';
          gap: 8px;
          transition: all 0.2s ease;
          textDecoration: none;
          border: none;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn-primary {
          background: #6366f1;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #4f46e5;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #f8fafc;
          color: #1e293b;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #f1f5f9;
          transform: translateY(-1px);
        }

        /* SMS Form Specific Styles */
        .tenant-selection {
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px;
          background: #f8fafc;
        }

        .tenant-checkbox {
          display: flex;
          alignItems: 'center';
          gap: 8px;
          padding: 6px 0;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
        }

        .tenant-checkbox input[type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .character-count {
          font-size: 12px;
          color: #64748b;
          text-align: right;
          margin-top: 4px;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .main-content-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .dashboard-container {
            padding: 24px 16px;
          }

          .header-content {
            flex-direction: column;
            gap: 16px;
          }
          
          .dashboard-title {
            font-size: 28px;
          }
          
          .welcome-message {
            font-size: 14px;
          }
          
          .metric-card {
            padding: 16px;
          }
          
          .metric-value {
            font-size: 24px;
          }
          
          .messages-section,
          .templates-section,
          .quick-actions-section {
            padding: 16px;
          }

          .messages-table-container {
            overflow-x: scroll;
          }

          .messages-table th,
          .messages-table td {
            padding: 12px 8px;
            font-size: 12px;
          }

          .section-actions {
            flex-direction: column;
            gap: 8px;
          }
        }

        @media (max-width: 480px) {
          .dashboard-container {
            padding: 16px;
          }

          .dashboard-title {
            font-size: 24px;
          }

          .welcome-message {
            font-size: 13px;
          }

          .section-header {
            flex-direction: column;
            gap: 12px;
            alignItems: stretch;
          }
        }

        /* Dark Mode Styles */
        :global(.dark-mode) .dashboard-container { background: transparent; }
        :global(.dark-mode) .chat-container {
          background: #111111 !important;
          border: 1px solid #333333 !important;
        }
        :global(.dark-mode) .conversations-panel {
          background: #0a0a0a !important;
          border-right: 1px solid #333333 !important;
        }
        :global(.dark-mode) .conversations-header {
          background: #111111 !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .conversations-title {
          color: #e2e8f0 !important;
        }
        :global(.dark-mode) .conversation-item {
          color: #e2e8f0 !important;
        }
        :global(.dark-mode) .conversation-item:hover {
          background: #1a1a1a !important;
        }
        :global(.dark-mode) .conversation-item.active {
          background: #4f46e5 !important;
        }
        :global(.dark-mode) .conversation-name {
          color: #e2e8f0 !important;
        }
        :global(.dark-mode) .conversation-item.active .conversation-name {
          color: white !important;
        }
        :global(.dark-mode) .chat-window {
          background: #111111 !important;
        }
        :global(.dark-mode) .chat-header {
          background: #111111 !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .participant-name {
          color: #e2e8f0 !important;
        }
        :global(.dark-mode) .messages-area {
          background: #111111 !important;
        }
        :global(.dark-mode) .message-bubble.received .message-content {
          background: #1a1a1a !important;
          color: #e2e8f0 !important;
        }
        :global(.dark-mode) .message-input-area {
          background: #111111 !important;
          border-top: 1px solid #333333 !important;
        }
        :global(.dark-mode) .message-input {
          background: #1a1a1a !important;
          border: 1px solid #333333 !important;
          color: #e2e8f0 !important;
        }
        :global(.dark-mode) .no-chat-selected {
          background: #111111 !important;
        }
        :global(.dark-mode) .no-chat-selected h3 {
          color: #e2e8f0 !important;
        }
        :global(.dark-mode) .right-sidebar {
          background: #0a0a0a !important;
          border-left: 1px solid #333333 !important;
        }
        :global(.dark-mode) .quick-actions-section,
        :global(.dark-mode) .templates-section {
          background: #111111 !important;
          border: 1px solid #333333 !important;
        }
        :global(.dark-mode) .section-title {
          color: #e2e8f0 !important;
        }
        :global(.dark-mode) .action-card,
        :global(.dark-mode) .template-card {
          background: #1a1a1a !important;
          border: 1px solid #333333 !important;
        }
        :global(.dark-mode) .action-card:hover,
        :global(.dark-mode) .template-card:hover {
          background: #222222 !important;
          border-color: #4b5563 !important;
        }
        :global(.dark-mode) .action-title,
        :global(.dark-mode) .template-title {
          color: #e2e8f0 !important;
        }
        :global(.dark-mode) .template-icon {
          background: rgba(99, 102, 241, 0.2) !important;
          color: #a5b4fc !important;
        }
        :global(.dark-mode) .metric-card:hover,
        :global(.dark-mode) .action-card:hover {
          background: #222222 !important;
          border-color: #ffffff !important;
        }
        :global(.dark-mode) .messages-table th {
          background-color: #1a1a1a !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .messages-table td {
          background-color: #111111 !important;
          border-bottom: 1px solid #333333 !important;
        }
        :global(.dark-mode) .messages-table tbody tr:hover {
          background-color: #222222 !important;
        }
        :global(.dark-mode) .refresh-btn {
            background: #1a1a1a !important;
            border: 1px solid #333333 !important;
        }
        :global(.dark-mode) .empty-action-btn,
        :global(.dark-mode) .btn-primary {
            background: #3b82f6 !important;
            border: none !important;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2) !important;
        }
        :global(.dark-mode) .empty-action-btn:hover,
        :global(.dark-mode) .btn-primary:hover:not(:disabled) {
            background: #2563eb !important;
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3) !important;
        }
        :global(.dark-mode) .btn-secondary {
            background: #1a1a1a !important;
            border: 1px solid #333333 !important;
            color: #ffffff !important;
        }
        :global(.dark-mode) .btn-secondary:hover {
            background: #2a2a2a !important;
            border-color: #ffffff !important;
        }
        :global(.dark-mode) .action-card.blue .action-icon { background: rgba(59, 130, 246, 0.3); }
        :global(.dark-mode) .action-card.green .action-icon { background: rgba(34, 197, 94, 0.3); }
        :global(.dark-mode) .action-card.purple .action-icon { background: rgba(139, 92, 246, 0.3); }
        :global(.dark-mode) .template-card { background: #1a1a1a !important; border-color: #333333 !important; }
        :global(.dark-mode) .template-card:hover { border-color: #4b5563 !important; background: #222222 !important; }
        :global(.dark-mode) .template-icon { background: rgba(99, 102, 241, 0.2) !important; color: #a5b4fc !important; }
        :global(.dark-mode) .message-form-section { background: #111111 !important; }
        :global(.dark-mode) .form-header { border-bottom-color: #333333 !important; }
        :global(.dark-mode) .close-btn { color: #6b7280 !important; }
        :global(.dark-mode) .close-btn:hover { color: #f9fafb !important; }
        :global(.dark-mode) .message-form .form-input {
          background: #1a1a1a !important;
          border-color: #4b5563 !important;
          color: #d1d5db !important;
        }
        :global(.dark-mode) .message-form .form-input:focus { border-color: #3b82f6 !important; }
        :global(.dark-mode) .message-form .form-input:disabled { background: #374151 !important; color: #6b7280 !important; }
        :global(.dark-mode) .message-form .form-input.readonly { 
          background: #1f2937 !important; 
          color: #9ca3af !important; 
          border-color: #374151 !important; 
        }
        :global(.dark-mode) .message-form .form-input.readonly:focus { 
          border-color: #374151 !important; 
          box-shadow: none !important; 
        }
        :global(.dark-mode) .message-form .form-actions { border-top-color: #333333 !important; }
        :global(.dark-mode) .tenant-selection { 
          background: #1a1a1a !important; 
          border-color: #333333 !important; 
        }
        :global(.dark-mode) .tenant-checkbox { color: #d1d5db !important; }
        :global(.dark-mode) .character-count { color: #9ca3af !important; }
        :global(.dark-mode) .date-highlight {
          background-color: #334155;
          color: #e2e8f0;
        }
        
        /* Dark mode communication log button styles */
        :global(.dark-mode) .communication-log-btn {
          background: #3b82f6 !important;
          color: white !important;
          border: none !important;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2) !important;
        }
        :global(.dark-mode) .communication-log-btn:hover {
          background: #2563eb !important;
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3) !important;
        }
        :global(.dark-mode) .communication-log-btn svg {
          stroke: white !important;
          fill: none !important;
        }

        /* Dark mode filter styles */
        :global(.dark-mode) .conversations-filters {
          background: #111111 !important;
          border-bottom-color: #333333 !important;
        }
        :global(.dark-mode) .search-input {
          background: #1a1a1a !important;
          border-color: #333333 !important;
          color: #e2e8f0 !important;
        }
        :global(.dark-mode) .search-input:focus {
          background: #222222 !important;
          border-color: #6366f1 !important;
        }
        :global(.dark-mode) .search-icon {
          color: #6b7280 !important;
        }
        :global(.dark-mode) .filter-btn {
          background: #1a1a1a !important;
          border-color: #333333 !important;
          color: #9ca3af !important;
        }
        :global(.dark-mode) .filter-btn:hover {
          background: #2a2a2a !important;
          border-color: #4b5563 !important;
        }
        :global(.dark-mode) .type-filter {
          background: #1a1a1a !important;
          border-color: #333333 !important;
          color: #9ca3af !important;
        }
        :global(.dark-mode) .type-filter.active {
          background: #4f46e5 !important;
          color: white !important;
          border-color: #4f46e5 !important;
        }
        :global(.dark-mode) .type-filter:hover:not(.active) {
          background: #2a2a2a !important;
          border-color: #4b5563 !important;
        }
        :global(.dark-mode) .sort-select {
          color: #e2e8f0 !important;
        }
        :global(.dark-mode) .sort-arrow {
          color: #9ca3af !important;
        }
        :global(.dark-mode) .unreads-label {
          color: #e2e8f0 !important;
        }
        :global(.dark-mode) .toggle-slider {
          background-color: #374151 !important;
        }
        :global(.dark-mode) .toggle-input:checked + .toggle-slider {
          background-color: #4f46e5 !important;
        }
        
        /* Auto-refresh indicator styles */
        .auto-refresh-indicator {
          display: inline-flex;
          alignItems: 'center';
          gap: 6px;
          margin-left: 12px;
          font-size: 14px;
          font-weight: 500;
          color: #10b981;
          background: rgba(16, 185, 129, 0.1);
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        
        .spinning {
          animation: spin 2s linear infinite;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        /* Dark mode auto-refresh indicator */
        :global(.dark-mode) .auto-refresh-indicator {
          color: #34d399 !important;
          background: rgba(52, 211, 153, 0.1) !important;
          border-color: rgba(52, 211, 153, 0.3) !important;
                  }
        `}</style>
    </DashboardLayout>
  );
}

export default withAuth(CommunicationPage, ['manager', 'owner']); 