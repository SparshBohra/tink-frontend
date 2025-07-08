import React, { useState, useEffect } from 'react';
import { Application, ApplicationViewing } from '../lib/types';
import { apiClient } from '../lib/api';

interface ViewingDashboardWidgetProps {
  applications?: Application[];
}

export default function ViewingDashboardWidget({ applications = [] }: ViewingDashboardWidgetProps) {
  const [todaysViewings, setTodaysViewings] = useState<ApplicationViewing[]>([]);
  const [upcomingViewings, setUpcomingViewings] = useState<ApplicationViewing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchViewings = async () => {
      try {
        setIsLoading(true);
        // Mock data for now - in real implementation, this would fetch from API
        const today = new Date().toISOString().split('T')[0];
        
        // Filter applications with scheduled viewings for today and upcoming
        const scheduledApplications = applications.filter(app => 
          app.status === 'viewing_scheduled' && app.viewings && app.viewings.length > 0
        );

        const todayViewings: ApplicationViewing[] = [];
        const upcomingViewings: ApplicationViewing[] = [];

        scheduledApplications.forEach(app => {
          app.viewings?.forEach(viewing => {
            if (viewing.scheduled_date === today) {
              todaysViewings.push(viewing);
            } else if (viewing.scheduled_date > today) {
              upcomingViewings.push(viewing);
            }
          });
        });

        setTodaysViewings(todayViewings);
        setUpcomingViewings(upcomingViewings.slice(0, 5)); // Show next 5 upcoming
      } catch (error) {
        console.error('Failed to fetch viewings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchViewings();
  }, [applications]);

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getApplicationForViewing = (viewing: ApplicationViewing) => {
    return applications.find(app => app.id === viewing.application);
  };

  if (isLoading) {
    return (
      <div className="dashboard-widget">
        <div className="widget-header">
          <h3>📅 Viewing Schedule</h3>
        </div>
        <div className="widget-content">
          <div className="loading-state">Loading viewings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-widget">
      <div className="widget-header">
        <h3>📅 Viewing Schedule</h3>
        <span className="widget-count">
          {todaysViewings.length + upcomingViewings.length} scheduled
        </span>
      </div>
      
      <div className="widget-content">
        {/* Today's Viewings */}
        <div className="viewing-section">
          <h4 className="section-title">Today ({todaysViewings.length})</h4>
          {todaysViewings.length === 0 ? (
            <div className="empty-state">
              <p>No viewings scheduled for today</p>
            </div>
          ) : (
            <div className="viewing-list">
              {todaysViewings.map((viewing) => {
                const application = getApplicationForViewing(viewing);
                return (
                  <div key={viewing.id} className="viewing-item today">
                    <div className="viewing-time">
                      {formatTime(viewing.scheduled_time)}
                    </div>
                    <div className="viewing-details">
                      <div className="tenant-name">
                        {application?.tenant_name || 'Unknown Tenant'}
                      </div>
                      <div className="property-name">
                        {application?.property_name || 'Unknown Property'}
                      </div>
                      <div className="contact-info">
                        Contact: {viewing.contact_person}
                      </div>
                    </div>
                    <div className="viewing-actions">
                      <button className="btn-sm success">
                        Complete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Viewings */}
        <div className="viewing-section">
          <h4 className="section-title">Upcoming ({upcomingViewings.length})</h4>
          {upcomingViewings.length === 0 ? (
            <div className="empty-state">
              <p>No upcoming viewings scheduled</p>
            </div>
          ) : (
            <div className="viewing-list">
              {upcomingViewings.map((viewing) => {
                const application = getApplicationForViewing(viewing);
                return (
                  <div key={viewing.id} className="viewing-item upcoming">
                    <div className="viewing-date">
                      {formatDate(viewing.scheduled_date)}
                      <div className="viewing-time-small">
                        {formatTime(viewing.scheduled_time)}
                      </div>
                    </div>
                    <div className="viewing-details">
                      <div className="tenant-name">
                        {application?.tenant_name || 'Unknown Tenant'}
                      </div>
                      <div className="property-name">
                        {application?.property_name || 'Unknown Property'}
                      </div>
                    </div>
                    <div className="viewing-actions">
                      <button className="btn-sm secondary">
                        Reschedule
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="widget-footer">
          <button className="btn-sm primary">
            Schedule New Viewing
          </button>
          <button className="btn-sm secondary">
            View All Viewings
          </button>
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

        .widget-count {
          font-size: 12px;
          color: #6b7280;
          background: #e5e7eb;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .widget-content {
          padding: 16px 20px;
          max-height: 400px;
          overflow-y: auto;
        }

        .viewing-section {
          margin-bottom: 20px;
        }

        .viewing-section:last-child {
          margin-bottom: 0;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 12px 0;
          padding-bottom: 4px;
          border-bottom: 1px solid #e5e7eb;
        }

        .viewing-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .viewing-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          font-size: 12px;
        }

        .viewing-item.today {
          background: #fef3c7;
          border-color: #f59e0b;
        }

        .viewing-item.upcoming {
          background: #f0f9ff;
          border-color: #0ea5e9;
        }

        .viewing-time {
          font-weight: 600;
          color: #1f2937;
          min-width: 60px;
          text-align: center;
        }

        .viewing-date {
          font-weight: 600;
          color: #1f2937;
          min-width: 60px;
          text-align: center;
        }

        .viewing-time-small {
          font-size: 10px;
          color: #6b7280;
          font-weight: 400;
        }

        .viewing-details {
          flex: 1;
        }

        .tenant-name {
          font-weight: 500;
          color: #1f2937;
          margin-bottom: 2px;
        }

        .property-name {
          color: #6b7280;
          margin-bottom: 2px;
        }

        .contact-info {
          color: #6b7280;
          font-size: 11px;
        }

        .viewing-actions {
          display: flex;
          gap: 4px;
        }

        .btn-sm {
          padding: 4px 8px;
          font-size: 11px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-sm.success {
          background: #10b981;
          color: white;
        }

        .btn-sm.success:hover {
          background: #059669;
        }

        .btn-sm.secondary {
          background: #6b7280;
          color: white;
        }

        .btn-sm.secondary:hover {
          background: #4b5563;
        }

        .btn-sm.primary {
          background: #3b82f6;
          color: white;
        }

        .btn-sm.primary:hover {
          background: #2563eb;
        }

        .empty-state {
          text-align: center;
          padding: 16px;
          color: #6b7280;
          font-size: 12px;
        }

        .loading-state {
          text-align: center;
          padding: 20px;
          color: #6b7280;
          font-size: 12px;
        }

        .widget-footer {
          display: flex;
          gap: 8px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
} 