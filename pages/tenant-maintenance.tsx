import React, { useState } from 'react';
import Head from 'next/head';
import { useAuth, withAuth } from '../lib/auth-context';

function TenantMaintenance() {
  const { user } = useAuth();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requests, setRequests] = useState([
    {
      id: 1,
      title: 'Leaky Faucet',
      category: 'Plumbing',
      priority: 'Medium',
      status: 'In Progress',
      date: '2024-01-15',
      description: 'Kitchen faucet is dripping constantly',
      notes: 'Plumber scheduled for tomorrow'
    },
    {
      id: 2,
      title: 'Broken Light Switch',
      category: 'Electrical',
      priority: 'Low',
      status: 'Completed',
      date: '2024-01-10',
      description: 'Living room light switch not working',
      notes: 'Replaced switch - completed'
    }
  ]);

  const [newRequest, setNewRequest] = useState({
    title: '',
    category: '',
    priority: 'Medium',
    description: '',
    photos: [] as File[]
  });

  const handleSubmitRequest = async () => {
    if (!newRequest.title || !newRequest.category || !newRequest.description) {
      alert('Please fill in all required fields');
      return;
    }

    const request = {
      id: Date.now(),
      ...newRequest,
      status: 'Submitted',
      date: new Date().toISOString().split('T')[0],
      notes: 'Request submitted - awaiting review'
    };

    setRequests([request, ...requests]);
    setNewRequest({
      title: '',
      category: '',
      priority: 'Medium',
      description: '',
      photos: []
    });
    setShowRequestModal(false);
    alert('Maintenance request submitted successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Submitted': return 'var(--primary-blue)';
      case 'In Progress': return 'var(--warning-amber)';
      case 'Completed': return 'var(--success-green)';
      case 'Cancelled': return 'var(--error-red)';
      default: return 'var(--gray-500)';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'var(--error-red)';
      case 'High': return 'var(--warning-amber)';
      case 'Medium': return 'var(--primary-blue)';
      case 'Low': return 'var(--success-green)';
      default: return 'var(--gray-500)';
    }
  };

  const getStats = () => {
    const open = requests.filter(r => ['Submitted', 'In Progress'].includes(r.status)).length;
    const completed = requests.filter(r => r.status === 'Completed').length;
    const inProgress = requests.filter(r => r.status === 'In Progress').length;
    return { open, completed, inProgress };
  };

  const stats = getStats();

  return (
    <div className="tenant-maintenance">
      <Head>
        <title>Maintenance Requests - Tenant Portal</title>
      </Head>

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Maintenance Requests</h1>
        <p className="page-subtitle">Submit and track maintenance requests for your unit</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.open}</div>
            <div className="stat-label">Open Requests</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
      </div>

      {/* Maintenance Requests */}
      <div className="requests-section">
        <div className="section-header">
          <h2 className="section-title">Your Maintenance Requests</h2>
          <button
            className="btn btn-primary"
            onClick={() => setShowRequestModal(true)}
          >
            New Request
          </button>
        </div>

        <div className="requests-grid">
          {requests.map((request) => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <h3 className="request-title">{request.title}</h3>
                <div className="request-badges">
                  <span 
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(request.priority) }}
                  >
                    {request.priority}
                  </span>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(request.status) }}
                  >
                    {request.status}
                  </span>
                </div>
              </div>
              
              <div className="request-details">
                <div className="request-meta">
                  <span className="request-category">{request.category}</span>
                  <span className="request-date">{request.date}</span>
                </div>
                <p className="request-description">{request.description}</p>
                {request.notes && (
                  <div className="request-notes">
                    <strong>Notes:</strong> {request.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Request Modal */}
      {showRequestModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Submit Maintenance Request</h3>
              <button
                className="modal-close"
                onClick={() => setShowRequestModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                  placeholder="Brief description of the issue"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  value={newRequest.category}
                  onChange={(e) => setNewRequest({...newRequest, category: e.target.value})}
                >
                  <option value="">Select category</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Heating">Heating</option>
                  <option value="Cooling">Cooling</option>
                  <option value="Appliances">Appliances</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={newRequest.priority}
                  onChange={(e) => setNewRequest({...newRequest, priority: e.target.value})}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  className="form-textarea"
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                  placeholder="Detailed description of the problem..."
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Photos (Optional)</label>
                <div className="photo-upload">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setNewRequest({...newRequest, photos: files});
                    }}
                    className="photo-input"
                  />
                  <p className="photo-help">Upload photos to help illustrate the issue</p>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowRequestModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmitRequest}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .tenant-maintenance {
          width: 100%;
          padding: 32px 40px 20px 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          box-sizing: border-box;
        }

        .page-header {
          margin-bottom: 24px;
        }

        .page-title {
          font-size: 22px;
          font-weight: 700;
          color: white;
          margin: 0 0 4px 0;
          line-height: 1.15;
        }

        .page-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          line-height: 1.45;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          font-size: 1.5rem;
          width: 50px;
          height: 50px;
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
          font-weight: 600;
        }

        .requests-section {
          background: white;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .requests-grid {
          display: grid;
          gap: 16px;
        }

        .request-card {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          transition: all 0.2s ease;
        }

        .request-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transform: translateY(-2px);
        }

        .request-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .request-title {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .request-badges {
          display: flex;
          gap: 8px;
        }

        .priority-badge,
        .status-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }

        .request-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .request-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #64748b;
        }

        .request-category {
          font-weight: 500;
        }

        .request-description {
          color: #374151;
          margin: 0;
          font-size: 14px;
        }

        .request-notes {
          background: #f8fafc;
          padding: 10px;
          border-radius: 6px;
          font-size: 12px;
          color: #374151;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #64748b;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          color: #374151;
        }

        .modal-body {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
          font-size: 14px;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          color: #374151;
          background: white;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .photo-upload {
          border: 2px dashed #d1d5db;
          border-radius: 6px;
          padding: 20px;
          text-align: center;
          transition: border-color 0.2s;
        }

        .photo-upload:hover {
          border-color: #3b82f6;
        }

        .photo-input {
          width: 100%;
          margin-bottom: 8px;
        }

        .photo-help {
          color: #64748b;
          font-size: 12px;
          margin: 0;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .btn {
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          text-decoration: none;
        }

        .btn-primary {
          background: #4f46e5;
          color: white;
        }

        .btn-primary:hover {
          background: #3730a3;
        }

        .btn-secondary {
          background: #f9fafb;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover {
          background: #f3f4f6;
        }

        @media (max-width: 768px) {
          .tenant-maintenance {
            padding: 24px 20px 20px 20px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .request-header {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }

          .request-badges {
            align-self: flex-start;
          }

          .request-meta {
            flex-direction: column;
            gap: 4px;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

export default withAuth(TenantMaintenance, ['tenant']); 