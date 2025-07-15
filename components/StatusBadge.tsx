import React from 'react';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary' | 'secondary';

interface StatusBadgeProps {
  status: StatusType | string;
  text?: string;
  small?: boolean;
}

/**
 * StatusBadge - A component for showing status indicators consistently
 */
export default function StatusBadge({
  status,
  text,
  small = false
}: StatusBadgeProps) {
  
  const getStatusClass = () => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'active':
      case 'approved':
      case 'completed':
      case 'paid':
      case 'lease_signed':
      case 'moved_in':
        return 'status-success';
      
      case 'warning':
      case 'pending':
      case 'in progress':
      case 'in review':
      case 'awaiting':
        return 'status-warning';
      
      case 'error':
      case 'rejected':
      case 'failed':
      case 'overdue':
      case 'cancelled':
      case 'withdrawn':
        return 'status-error';
      
      case 'info':
      case 'new':
      case 'processing':
      case 'draft':
      case 'viewing_scheduled':
        return 'status-info';

      case 'primary':
      case 'room_assigned':
      case 'lease_created':
        return 'status-primary';

      case 'secondary':
      case 'viewing_completed':
        return 'status-secondary';
      
      default:
        return 'status-neutral';
    }
  };
  
  const getDisplayText = () => {
    if (text) return text;
    
    // Map status values to display text
    switch (status.toLowerCase()) {
      case 'approved':
        return 'Shortlisted';
      case 'pending':
        return 'Awaiting Review';
      case 'rejected':
        return 'Rejected';
      case 'viewing_scheduled':
        return 'Viewing Scheduled';
      case 'viewing_completed':
        return 'Viewing Completed';
      case 'processing':
        return 'Processing';
      case 'room_assigned':
        return 'Room Assigned';
      case 'lease_created':
        return 'Lease Generated';
      case 'lease_signed':
        return 'Lease Signed';
      case 'moved_in':
        return 'Moved In';
      case 'active':
        return 'Active';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };
  
  const displayText = getDisplayText();
  
  return (
    <span className={`status-badge ${getStatusClass()} ${small ? 'small' : ''}`}>
      <span className="status-dot"></span>
      <span className="status-text">{displayText}</span>
      
      <style jsx>{`
        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 999px;
          font-weight: 500;
          font-size: var(--text-small);
        }
        
        .status-badge.small {
          padding: 1px 6px;
          font-size: 10px;
        }
        
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          margin-right: 6px;
        }
        
        .status-success {
          background: rgba(16, 185, 129, 0.1);
          color: #065f46;
        }
        
        .status-success .status-dot {
          background: var(--success-green);
        }
        
        .status-warning {
          background: rgba(245, 158, 11, 0.1);
          color: #78350f;
        }
        
        .status-warning .status-dot {
          background: var(--warning-amber);
        }
        
        .status-error {
          background: rgba(239, 68, 68, 0.1);
          color: #7f1d1d;
        }
        
        .status-error .status-dot {
          background: var(--error-red);
        }
        
        .status-info {
          background: rgba(139, 92, 246, 0.1);
          color: #4c1d95;
        }
        
        .status-info .status-dot {
          background: var(--info-purple);
        }

        .status-primary {
          background: rgba(59, 130, 246, 0.1);
          color: #1e40af;
        }

        .status-primary .status-dot {
          background: #3b82f6;
        }

        .status-secondary {
          background: rgba(6, 182, 212, 0.1);
          color: #0891b2;
        }

        .status-secondary .status-dot {
          background: #06b6d4;
        }
        
        .status-neutral {
          background: rgba(107, 114, 128, 0.1);
          color: #374151;
        }
        
        .status-neutral .status-dot {
          background: var(--gray-400);
        }
      `}</style>
    </span>
  );
}