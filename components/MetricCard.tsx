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
          background: white;
          border-radius: var(--radius-md);
          padding: var(--spacing-lg);
          border-top: 4px solid;
          box-shadow: var(--shadow-sm);
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .metric-blue { border-color: var(--primary-blue); }
        .metric-green { border-color: var(--success-green); }
        .metric-amber { border-color: var(--warning-amber); }
        .metric-purple { border-color: var(--info-purple); }
        .metric-gray { border-color: var(--gray-400); }
        
        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }
        
        .metric-title {
          font-size: var(--text-body);
          font-weight: 500;
          color: var(--gray-600);
          margin: 0;
        }
        
        .metric-icon {
          color: var(--gray-400);
        }
        
        .metric-value {
          font-size: 28px;
          font-weight: 600;
          color: var(--gray-900);
          margin: var(--spacing-sm) 0;
        }
        
        .currency {
          font-size: 20px;
          vertical-align: top;
          margin-right: 2px;
        }
        
        .metric-subtitle {
          font-size: var(--text-small);
          color: var(--gray-400);
          margin-top: auto;
        }
      `}</style>
    </div>
  );
} 