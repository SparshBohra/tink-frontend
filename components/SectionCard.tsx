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
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03), 
                      0 1px 3px rgba(0, 0, 0, 0.02), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.8);
          margin-bottom: 32px;
          overflow: hidden;
          position: relative;
          transition: all 0.3s ease;
        }

        .section-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%);
          pointer-events: none;
        }

        .section-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05), 
                      0 2px 6px rgba(0, 0, 0, 0.03), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.9);
          border-color: rgba(59, 130, 246, 0.2);
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 28px;
          background: rgba(248, 250, 252, 0.8);
          border-bottom: 1px solid rgba(226, 232, 240, 0.5);
          position: relative;
        }

        .section-header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 28px;
          right: 28px;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%);
        }
        
        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }
        
        .section-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 6px 0 0 0;
          font-weight: 500;
        }
        
        .section-content {
          padding: 28px;
          position: relative;
          background: rgba(255, 255, 255, 0.5);
        }
        
        .section-content.no-padding {
          padding: 0;
          background: transparent;
        }
        
        @media (max-width: 768px) {
          .section-card {
            border-radius: 20px;
            margin-bottom: 24px;
          }

          .section-header {
            padding: 20px 24px;
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .section-header::after {
            left: 24px;
            right: 24px;
          }
          
          .section-action {
            width: 100%;
            display: flex;
            justify-content: flex-end;
          }
          
          .section-content {
            padding: 24px;
          }

          .section-title {
            font-size: 18px;
          }

          .section-subtitle {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
} 