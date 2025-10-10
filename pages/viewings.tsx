import React, { useState } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import ViewingManagementModal from '../components/ViewingManagementModal';

export default function ViewingsPage() {
  const [showViewingModal, setShowViewingModal] = useState(false);

  return (
    <DashboardLayout>
      <Head>
        <title>Viewings - SquareFt</title>
      </Head>

      <div className="viewings-page">
        <div className="page-header">
          <div className="header-content">
            <h1>Property Viewings</h1>
            <p>Manage scheduled viewings, track completions, and handle cancellations</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => setShowViewingModal(true)}
              className="btn btn-primary"
            >
              📅 Manage Viewings
            </button>
          </div>
        </div>

        <div className="page-content">
          <div className="viewing-overview">
            <div className="overview-card">
              <div className="card-icon">📅</div>
              <div className="card-content">
                <h3>Simple Viewing Management</h3>
                <p>Track all your property viewings in one place with a simple todo-list interface:</p>
                <ul>
                  <li><strong>Scheduled</strong> - Upcoming viewings ready to complete</li>
                  <li><strong>Completed</strong> - Finished viewings with outcomes</li>
                  <li><strong>Cancelled/Rescheduled</strong> - Modified or cancelled viewings</li>
                </ul>
                <p>View contact information, property details, and room assignments all in one organized view.</p>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-grid">
                <button 
                  onClick={() => setShowViewingModal(true)}
                  className="action-card"
                >
                  <div className="action-icon">📋</div>
                  <div className="action-title">View All Viewings</div>
                  <div className="action-description">See all viewings organized by status</div>
                </button>
                
                <div className="action-card disabled">
                  <div className="action-icon">➕</div>
                  <div className="action-title">Schedule Viewing</div>
                  <div className="action-description">Schedule from applications page</div>
                </div>

                <div className="action-card disabled">
                  <div className="action-icon">📊</div>
                  <div className="action-title">Viewing Reports</div>
                  <div className="action-description">Coming soon</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Viewing Management Modal */}
        {showViewingModal && (
          <ViewingManagementModal
            isOpen={showViewingModal}
            onClose={() => setShowViewingModal(false)}
          />
        )}

        <style jsx>{`
          .viewings-page {
            padding: 24px;
            max-width: 1200px;
            margin: 0 auto;
          }

          .page-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 1px solid #e2e8f0;
          }

          .header-content h1 {
            margin: 0 0 8px 0;
            font-size: 32px;
            font-weight: 700;
            color: #1f2937;
          }

          .header-content p {
            margin: 0;
            color: #6b7280;
            font-size: 16px;
          }

          .header-actions {
            display: flex;
            gap: 12px;
          }

          .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .btn-primary {
            background: #3b82f6;
            color: white;
          }

          .btn-primary:hover {
            background: #2563eb;
            transform: translateY(-1px);
          }

          .page-content {
            display: flex;
            flex-direction: column;
            gap: 32px;
          }

          .viewing-overview {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 32px;
          }

          .overview-card {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 32px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          .card-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }

          .card-content h3 {
            margin: 0 0 16px 0;
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
          }

          .card-content p {
            margin: 0 0 16px 0;
            color: #6b7280;
            line-height: 1.6;
          }

          .card-content ul {
            margin: 16px 0;
            padding-left: 20px;
            color: #6b7280;
          }

          .card-content li {
            margin-bottom: 8px;
            line-height: 1.5;
          }

          .quick-actions {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          .quick-actions h3 {
            margin: 0 0 20px 0;
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
          }

          .action-grid {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .action-card {
            padding: 16px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            background: white;
            text-align: left;
          }

          .action-card:hover:not(.disabled) {
            border-color: #3b82f6;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
          }

          .action-card.disabled {
            opacity: 0.6;
            cursor: not-allowed;
            background: #f9fafb;
          }

          .action-icon {
            font-size: 24px;
            margin-bottom: 8px;
          }

          .action-title {
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
          }

          .action-description {
            font-size: 13px;
            color: #6b7280;
          }

          @media (max-width: 768px) {
            .viewings-page {
              padding: 16px;
            }

            .page-header {
              flex-direction: column;
              gap: 16px;
            }

            .header-content h1 {
              font-size: 28px;
            }

            .viewing-overview {
              grid-template-columns: 1fr;
              gap: 24px;
            }

            .overview-card,
            .quick-actions {
              padding: 20px;
            }
          }
        `}</style>
      </div>
    </DashboardLayout>
  );
} 