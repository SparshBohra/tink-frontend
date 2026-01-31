import React, { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

/**
 * EmptyState - A component for displaying consistent empty states across the platform
 */
export default function EmptyState({
  title,
  description,
  icon,
  action,
  compact = false
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${compact ? 'compact' : ''}`}>
      {icon && <div className="empty-icon">{icon}</div>}
      
      <div className="empty-content">
        <h3 className="empty-title">{title}</h3>
        {description && <p className="empty-description">{description}</p>}
      </div>
      
      {action && <div className="empty-action">{action}</div>}
      
      <style jsx>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: var(--spacing-xl);
          background: var(--gray-50);
          border-radius: var(--radius-md);
          border: 1px dashed var(--gray-200);
        }
        
        .empty-state.compact {
          padding: var(--spacing-lg);
        }
        
        .empty-icon {
          margin-bottom: var(--spacing-md);
          color: var(--gray-400);
          font-size: 24px;
        }
        
        .empty-title {
          font-size: var(--text-h3);
          font-weight: 500;
          color: var(--gray-800);
          margin: 0 0 var(--spacing-sm) 0;
        }
        
        .empty-description {
          font-size: var(--text-body);
          color: var(--gray-600);
          margin: 0 0 var(--spacing-lg) 0;
        }
        
        .empty-action {
          margin-top: var(--spacing-lg);
        }
      `}</style>
    </div>
  );
} 