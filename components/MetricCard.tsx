import React, { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'gray';
  icon?: ReactNode;
  isMonetary?: boolean;
}

/**
 * MetricCard - A component for displaying important metrics/KPIs in dashboards
 */
export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  color = 'blue',
  icon,
  isMonetary = false 
}: MetricCardProps) {
  
  const getColorClass = () => {
    switch (color) {
      case 'green': return 'metric-green';
      case 'amber': return 'metric-amber';
      case 'purple': return 'metric-purple';
      case 'gray': return 'metric-gray';
      default: return 'metric-blue';
    }
  };
  
  return (
    <div className={`metric-card ${getColorClass()}`}>
      <div className="metric-header">
        <h3 className="metric-title">{title}</h3>
        {icon && <div className="metric-icon">{icon}</div>}
      </div>
      
      <div className="metric-value">
        {isMonetary && <span className="currency">$</span>}
        {value}
      </div>
      
      {subtitle && <div className="metric-subtitle">{subtitle}</div>}
      
      <style jsx>{`
        .metric-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 24px;
          border: 1px solid rgba(226, 232, 240, 0.6);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03), 
                      0 1px 3px rgba(0, 0, 0, 0.02), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.8);
          height: 100%;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .metric-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          border-radius: 20px 20px 0 0;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05), 
                      0 2px 6px rgba(0, 0, 0, 0.03), 
                      inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }
        
        .metric-blue::before { background: linear-gradient(90deg, #3b82f6, #2563eb); }
        .metric-green::before { background: linear-gradient(90deg, #10b981, #059669); }
        .metric-amber::before { background: linear-gradient(90deg, #f59e0b, #d97706); }
        .metric-purple::before { background: linear-gradient(90deg, #8b5cf6, #7c3aed); }
        .metric-gray::before { background: linear-gradient(90deg, #6b7280, #4b5563); }
        
        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .metric-title {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .metric-icon {
          color: #9ca3af;
          font-size: 18px;
        }
        
        .metric-value {
          font-size: 32px;
          font-weight: 700;
          color: #1f2937;
          margin: 12px 0;
          line-height: 1;
        }
        
        .currency {
          font-size: 24px;
          vertical-align: top;
          margin-right: 2px;
          opacity: 0.8;
        }
        
        .metric-subtitle {
          font-size: 13px;
          color: #9ca3af;
          margin-top: auto;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .metric-card {
            padding: 20px;
          }

          .metric-value {
            font-size: 28px;
          }

          .metric-title {
            font-size: 13px;
          }

          .metric-subtitle {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
} 