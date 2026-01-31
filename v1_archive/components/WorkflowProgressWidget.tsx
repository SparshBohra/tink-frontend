import React, { useState, useEffect } from 'react';
import { Application, APPLICATION_STATUSES, getStatusDisplayName } from '../lib/types';

interface WorkflowProgressWidgetProps {
  applications?: Application[];
}

interface StatusStats {
  status: string;
  count: number;
  percentage: number;
  avgDays?: number;
}

export default function WorkflowProgressWidget({ applications = [] }: WorkflowProgressWidgetProps) {
  const [statusStats, setStatusStats] = useState<StatusStats[]>([]);
  const [bottlenecks, setBottlenecks] = useState<StatusStats[]>([]);

  useEffect(() => {
    if (applications.length === 0) return;

    // Calculate status distribution
    const statusCounts: { [key: string]: number } = {};
    const statusDays: { [key: string]: number[] } = {};

    applications.forEach(app => {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
      
      // Calculate days in current status (mock calculation)
      const createdDate = new Date(app.created_at);
      const now = new Date();
      const daysInStatus = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (!statusDays[app.status]) statusDays[app.status] = [];
      statusDays[app.status].push(daysInStatus);
    });

    // Convert to stats array
    const stats: StatusStats[] = Object.entries(statusCounts).map(([status, count]) => {
      const avgDays = statusDays[status] 
        ? statusDays[status].reduce((a, b) => a + b, 0) / statusDays[status].length 
        : 0;
      
      return {
        status,
        count,
        percentage: Math.round((count / applications.length) * 100),
        avgDays: Math.round(avgDays),
      };
    }).sort((a, b) => b.count - a.count);

    setStatusStats(stats);

    // Identify bottlenecks (statuses with high avg days)
    const bottleneckThreshold = 7; // 7+ days considered a bottleneck
    const bottleneckStats = stats.filter(stat => (stat.avgDays || 0) > bottleneckThreshold);
    setBottlenecks(bottleneckStats);
  }, [applications]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case APPLICATION_STATUSES.PENDING: return '#f59e0b';
      case APPLICATION_STATUSES.APPROVED: return '#10b981';
      case APPLICATION_STATUSES.VIEWING_SCHEDULED: return '#3b82f6';
      case APPLICATION_STATUSES.VIEWING_COMPLETED: return '#06b6d4';
      case APPLICATION_STATUSES.ROOM_ASSIGNED: return '#8b5cf6';
      case APPLICATION_STATUSES.LEASE_CREATED: return '#06b6d4';
      case APPLICATION_STATUSES.LEASE_SIGNED: return '#10b981';
      case APPLICATION_STATUSES.MOVED_IN: return '#059669';
      case APPLICATION_STATUSES.REJECTED: return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getEfficiencyScore = () => {
    if (applications.length === 0) return 0;
    
    const completedApps = applications.filter(app => 
      app.status === APPLICATION_STATUSES.MOVED_IN || 
      app.status === APPLICATION_STATUSES.ACTIVE
    ).length;
    
    const activeApps = applications.filter(app => 
      app.status !== APPLICATION_STATUSES.REJECTED &&
      app.status !== APPLICATION_STATUSES.MOVED_IN &&
      app.status !== APPLICATION_STATUSES.ACTIVE
    ).length;
    
    if (completedApps + activeApps === 0) return 0;
    return Math.round((completedApps / (completedApps + activeApps)) * 100);
  };

  const efficiencyScore = getEfficiencyScore();

  return (
    <div className="dashboard-widget">
      <div className="widget-header">
        <h3>📊 Workflow Progress</h3>
        <div className="efficiency-score">
          <span className="score-label">Efficiency</span>
          <span className={`score-value ${efficiencyScore >= 80 ? 'good' : efficiencyScore >= 60 ? 'fair' : 'poor'}`}>
            {efficiencyScore}%
          </span>
        </div>
      </div>
      
      <div className="widget-content">
        {/* Status Distribution */}
        <div className="section">
          <h4 className="section-title">Status Distribution</h4>
          <div className="status-list">
            {statusStats.map((stat) => (
              <div key={stat.status} className="status-item">
                <div className="status-info">
                  <div 
                    className="status-dot"
                    style={{ backgroundColor: getStatusColor(stat.status) }}
                  ></div>
                  <div className="status-details">
                    <span className="status-name">
                      {getStatusDisplayName(stat.status)}
                    </span>
                    <span className="status-meta">
                      {stat.count} apps • Avg {stat.avgDays} days
                    </span>
                  </div>
                </div>
                <div className="status-stats">
                  <span className="status-percentage">{stat.percentage}%</span>
                  <div className="status-bar">
                    <div 
                      className="status-fill"
                      style={{ 
                        width: `${stat.percentage}%`,
                        backgroundColor: getStatusColor(stat.status)
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottlenecks */}
        {bottlenecks.length > 0 && (
          <div className="section">
            <h4 className="section-title">⚠️ Bottlenecks Detected</h4>
            <div className="bottleneck-list">
              {bottlenecks.map((bottleneck) => (
                <div key={bottleneck.status} className="bottleneck-item">
                  <div className="bottleneck-status">
                    {getStatusDisplayName(bottleneck.status)}
                  </div>
                  <div className="bottleneck-details">
                    <span className="bottleneck-days">
                      {bottleneck.avgDays} days avg
                    </span>
                    <span className="bottleneck-count">
                      {bottleneck.count} applications
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="bottleneck-suggestion">
              <p>💡 Consider reviewing these stages for process improvements</p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="section">
          <div className="quick-stats">
            <div className="quick-stat">
              <div className="stat-value">{applications.length}</div>
              <div className="stat-label">Total Applications</div>
            </div>
            <div className="quick-stat">
              <div className="stat-value">
                {applications.filter(app => 
                  app.status !== APPLICATION_STATUSES.REJECTED &&
                  app.status !== APPLICATION_STATUSES.MOVED_IN &&
                  app.status !== APPLICATION_STATUSES.ACTIVE
                ).length}
              </div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="quick-stat">
              <div className="stat-value">
                {applications.filter(app => 
                  app.status === APPLICATION_STATUSES.MOVED_IN || 
                  app.status === APPLICATION_STATUSES.ACTIVE
                ).length}
              </div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-widget {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .widget-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .efficiency-score {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .score-label {
          font-size: 12px;
          color: #6b7280;
        }

        .score-value {
          font-size: 14px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .score-value.good {
          background: #d1fae5;
          color: #065f46;
        }

        .score-value.fair {
          background: #fef3c7;
          color: #92400e;
        }

        .score-value.poor {
          background: #fee2e2;
          color: #991b1b;
        }

        .widget-content {
          padding: 16px 20px;
          max-height: 400px;
          overflow-y: auto;
        }

        .section {
          margin-bottom: 20px;
        }

        .section:last-child {
          margin-bottom: 0;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 12px 0;
        }

        .status-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          border-radius: 6px;
          background: #f9fafb;
        }

        .status-info {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .status-name {
          font-size: 12px;
          font-weight: 500;
          color: #1f2937;
        }

        .status-meta {
          font-size: 10px;
          color: #6b7280;
        }

        .status-stats {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 80px;
        }

        .status-percentage {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          min-width: 30px;
          text-align: right;
        }

        .status-bar {
          width: 40px;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
        }

        .status-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .bottleneck-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .bottleneck-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
        }

        .bottleneck-status {
          font-size: 12px;
          font-weight: 500;
          color: #991b1b;
        }

        .bottleneck-details {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .bottleneck-days {
          font-size: 11px;
          font-weight: 600;
          color: #dc2626;
        }

        .bottleneck-count {
          font-size: 10px;
          color: #6b7280;
        }

        .bottleneck-suggestion {
          margin-top: 8px;
          padding: 6px 8px;
          background: #fffbeb;
          border: 1px solid #fed7aa;
          border-radius: 4px;
        }

        .bottleneck-suggestion p {
          margin: 0;
          font-size: 11px;
          color: #92400e;
        }

        .quick-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .quick-stat {
          text-align: center;
          padding: 12px;
          background: #f9fafb;
          border-radius: 6px;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
} 