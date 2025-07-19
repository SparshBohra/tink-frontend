import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth, withAuth } from '../lib/auth-context';

function TenantDashboard() {
  const { user } = useAuth();
  const [rentDue, setRentDue] = useState(1250);
  const [daysUntilDue, setDaysUntilDue] = useState(8);
  const [maintenanceRequests, setMaintenanceRequests] = useState(1);
  const [newAnnouncements, setNewAnnouncements] = useState(2);

  return (
    <div className="tenant-dashboard">
      <Head>
        <title>Tenant Dashboard - Tink Property Management</title>
      </Head>

      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">Welcome back, {user?.full_name || 'John Smith'}!</h1>
        <p className="dashboard-subtitle">Sunset Gardens Apartments - Room A101</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card rent-due">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">${rentDue}</div>
            <div className="stat-label">Rent Due</div>
            <div className="stat-meta">Due in {daysUntilDue} days</div>
          </div>
          <Link href="/tenant-payments" className="stat-action">
            Pay Now
          </Link>
        </div>

        <div className="stat-card maintenance">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{maintenanceRequests}</div>
            <div className="stat-label">Open Requests</div>
            <div className="stat-meta">In progress</div>
          </div>
          <Link href="/tenant-maintenance" className="stat-action">
            View All
          </Link>
        </div>

        <div className="stat-card announcements">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{newAnnouncements}</div>
            <div className="stat-label">New Updates</div>
            <div className="stat-meta">Unread messages</div>
          </div>
          <Link href="/tenant-announcements" className="stat-action">
            View All
          </Link>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="main-content-grid">
        {/* Recent Activity */}
        <div className="recent-activity">
          <h2 className="section-title">Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <div className="activity-content">
                <div className="activity-title">Rent Payment Processed</div>
                <div className="activity-date">January 1, 2024</div>
              </div>
              <div className="activity-amount">$1,250</div>
            </div>

            <div className="activity-item">
              <div className="activity-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <div className="activity-content">
                <div className="activity-title">Maintenance Request: Leaky Faucet</div>
                <div className="activity-date">January 15, 2024</div>
              </div>
              <div className="activity-status">In Progress</div>
            </div>

            <div className="activity-item">
              <div className="activity-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                </svg>
              </div>
              <div className="activity-content">
                <div className="activity-title">New Announcement: Building Maintenance</div>
                <div className="activity-date">January 20, 2024</div>
              </div>
              <div className="activity-status">New</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2 className="section-title">Quick Actions</h2>
          <div className="actions-grid">
            <Link href="/tenant-payments" className="action-card">
              <div className="action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <div className="action-content">
                <h3 className="action-title">Pay Rent</h3>
                <p className="action-description">Make a payment for this month's rent</p>
              </div>
            </Link>

            <Link href="/tenant-maintenance" className="action-card">
              <div className="action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <div className="action-content">
                <h3 className="action-title">Submit Maintenance Request</h3>
                <p className="action-description">Report an issue that needs attention</p>
              </div>
            </Link>

            <Link href="/tenant-announcements" className="action-card">
              <div className="action-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                </svg>
              </div>
              <div className="action-content">
                <h3 className="action-title">View Announcements</h3>
                <p className="action-description">Check latest updates and notices</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .tenant-dashboard {
          width: 100%;
          padding: 32px 40px 20px 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          box-sizing: border-box;
        }

        .dashboard-header {
          margin-bottom: 16px;
        }

        .dashboard-title {
          font-size: 22px;
          font-weight: 700;
          color: white;
          margin: 0 0 4px 0;
          line-height: 1.15;
        }

        .dashboard-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          line-height: 1.45;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          font-size: 1.25rem;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 3px;
          line-height: 1;
        }

        .stat-label {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 6px;
          font-weight: 600;
        }

        .stat-meta {
          font-size: 12px;
          color: #64748b;
        }

        .stat-action {
          background: #4f46e5;
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }

        .stat-action:hover {
          background: #3730a3;
        }

        .main-content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-bottom: 0;
          align-items: start;
        }

        .quick-actions, .recent-activity {
          background: white;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          height: fit-content;
        }

        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 12px 0;
        }

        .actions-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 0;
        }

        .action-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .action-icon {
          font-size: 1.1rem;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #3b82f6;
          color: white;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .action-content {
          flex: 1;
        }

        .action-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .action-description {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 0;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .activity-item:hover {
          background: #f9fafb;
        }

        .activity-icon {
          font-size: 1.1rem;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          border-radius: 6px;
          flex-shrink: 0;
        }

        .activity-content {
          flex: 1;
        }

        .activity-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .activity-date {
          font-size: 12px;
          color: #64748b;
        }

        .activity-amount {
          font-size: 14px;
          font-weight: 600;
          color: #10b981;
        }

        .activity-status {
          font-size: 12px;
          font-weight: 500;
          color: #4f46e5;
        }

        @media (max-width: 1024px) {
          .main-content-grid {
            gap: 16px;
          }
        }

        @media (max-width: 768px) {
          .tenant-dashboard {
            padding: 24px 20px 20px 20px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .main-content-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default withAuth(TenantDashboard, ['tenant']); 