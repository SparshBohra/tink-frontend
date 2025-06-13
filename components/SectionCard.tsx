import React, { ReactNode } from 'react';

interface SectionCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  noPadding?: boolean;
}

/**
 * SectionCard - A component for creating uniform content sections on dashboard pages
 */
export default function SectionCard({ 
  children, 
  title, 
  subtitle,
  action,
  noPadding = false
}: SectionCardProps) {
  return (
    <div className="section-card">
      {(title || action) && (
        <div className="section-header">
          <div className="section-title-container">
            {title && <h2 className="section-title">{title}</h2>}
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
          
          {action && <div className="section-action">{action}</div>}
        </div>
      )}
      
      <div className={`section-content ${noPadding ? 'no-padding' : ''}`}>
        {children}
      </div>
      
      <style jsx>{`
        .section-card {
          background: white;
          border-radius: var(--radius-md);
          border: 1px solid var(--gray-200);
          box-shadow: var(--shadow-sm);
          margin-bottom: var(--spacing-xl);
          overflow: hidden;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--gray-100);
        }
        
        .section-title {
          font-size: var(--text-h3);
          font-weight: 500;
          color: var(--gray-900);
          margin: 0;
        }
        
        .section-subtitle {
          font-size: var(--text-small);
          color: var(--gray-600);
          margin: var(--spacing-xs) 0 0 0;
        }
        
        .section-content {
          padding: var(--spacing-lg);
        }
        
        .section-content.no-padding {
          padding: 0;
        }
        
        @media (max-width: 768px) {
          .section-header {
            padding: var(--spacing-md);
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-sm);
          }
          
          .section-action {
            width: 100%;
            display: flex;
            justify-content: flex-end;
          }
          
          .section-content {
            padding: var(--spacing-md);
          }
        }
      `}</style>
    </div>
  );
} 