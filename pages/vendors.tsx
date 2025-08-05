import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth, withAuth } from '../lib/auth-context';
import { expenseApi } from '../lib/api';
import { Vendor, VendorFormData } from '../lib/types';

function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorLoading, setVendorLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorFormData, setVendorFormData] = useState<VendorFormData>({
    name: '',
    vendor_type: 'other',
    contact_email: '',
    contact_phone: '',
    contact_person: '',
    address: '',
    tax_id: '',
    website: '',
    notes: '',
    landlord: 0,
    is_active: true
  });
  
  // Vendor delete confirmation
  const [showVendorDeleteModal, setShowVendorDeleteModal] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<{ id: number; name: string } | null>(null);
  const [vendorDeleteLoading, setVendorDeleteLoading] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setVendorLoading(true);
      setError(null);
      const vendorsData = await expenseApi.getVendors();
      setVendors(vendorsData);
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to load vendors');
    } finally {
      setVendorLoading(false);
    }
  };

  const handleCreateVendor = () => {
    setEditingVendor(null);
    setVendorFormData({
      name: '',
      vendor_type: 'other',
      contact_email: '',
      contact_phone: '',
      contact_person: '',
      address: '',
      tax_id: '',
      website: '',
      notes: '',
      landlord: 0,
      is_active: true
    });
    setShowVendorForm(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setVendorFormData({
      name: vendor.name,
      vendor_type: vendor.vendor_type,
      contact_email: vendor.contact_email || '',
      contact_phone: vendor.contact_phone || '',
      contact_person: vendor.contact_person || '',
      address: vendor.address || '',
      tax_id: vendor.tax_id || '',
      website: vendor.website || '',
      notes: vendor.notes || '',
      landlord: vendor.landlord || 0,
      is_active: vendor.is_active
    });
    setShowVendorForm(true);
  };

  const handleDeleteVendor = (vendorId: number, vendorName: string) => {
    setVendorToDelete({ id: vendorId, name: vendorName });
    setShowVendorDeleteModal(true);
  };

  const handleVendorFormChange = (field: keyof VendorFormData, value: any) => {
    setVendorFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const cancelVendorForm = () => {
    setShowVendorForm(false);
    setEditingVendor(null);
    // Re-enable body scroll
    document.body.style.overflow = 'unset';
  };

  // Disable body scroll when modal opens
  useEffect(() => {
    if (showVendorForm || showVendorDeleteModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showVendorForm, showVendorDeleteModal]);

  const confirmDeleteVendor = async () => {
    if (!vendorToDelete) return;
    
    try {
      setVendorDeleteLoading(true);
      await expenseApi.deleteVendor(vendorToDelete.id);
      await fetchVendors();
      setSuccess(`Vendor "${vendorToDelete.name}" has been deleted successfully.`);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error deleting vendor:', err);
      setError('Failed to delete vendor');
      setTimeout(() => setError(null), 5000);
    } finally {
      setVendorDeleteLoading(false);
      setShowVendorDeleteModal(false);
      setVendorToDelete(null);
    }
  };

  const handleSubmitVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await expenseApi.updateVendor(editingVendor.id, vendorFormData);
        setSuccess(`Vendor "${vendorFormData.name}" has been updated successfully.`);
      } else {
        await expenseApi.createVendor(vendorFormData);
        setSuccess(`Vendor "${vendorFormData.name}" has been created successfully.`);
      }
      await fetchVendors();
      setShowVendorForm(false);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Error saving vendor:', err);
      setError('Failed to save vendor');
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <DashboardLayout title="Vendors">
      <Head>
        <title>Vendors - Tink</title>
      </Head>

      <div className="dashboard-container">


        {/* Alerts */}
        {error && (
          <div className="error-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="close-alert">×</button>
          </div>
        )}

        {success && (
          <div className="success-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="close-alert">×</button>
          </div>
        )}

        {/* Vendors Section */}
        <div className="vendors-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Vendor Management ({vendors.length})</h2>
              <p className="section-subtitle">Manage your vendors and suppliers</p>
            </div>
            <div className="section-actions">
              <button 
                onClick={() => fetchVendors()}
                className="refresh-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
                Refresh
              </button>
              <button 
                onClick={handleCreateVendor}
                className="create-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Vendor
              </button>
            </div>
          </div>
          
          {vendorLoading ? (
            <div className="loading-container">
              <LoadingSpinner />
            </div>
          ) : vendors.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                </svg>
              </div>
              <h3>No vendors yet</h3>
              <p>Start by adding your first vendor or supplier</p>
              <button onClick={handleCreateVendor} className="create-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Your First Vendor
              </button>
            </div>
          ) : (
            <div className="vendors-table-container">
              <table className="vendors-table">
                <thead>
                  <tr>
                    <th className="table-left">Vendor</th>
                    <th className="table-left">Type</th>
                    <th className="table-left">Contact</th>
                    <th className="table-center">Total Expenses</th>
                    <th className="table-center">Status</th>
                    <th className="table-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor) => (
                    <tr key={vendor.id}>
                      <td className="table-left">
                        <div className="vendor-info">
                          <div className="vendor-name">{vendor.name}</div>
                          <div className="vendor-id">ID: {vendor.id}</div>
                        </div>
                      </td>
                      <td className="table-left">
                        <span className="vendor-type-badge">
                          {vendor.vendor_type_display}
                        </span>
                      </td>
                      <td className="table-left">
                        <div className="vendor-contact">
                          {vendor.contact_person && (
                            <div className="contact-person">{vendor.contact_person}</div>
                          )}
                          {vendor.contact_email && (
                            <div className="contact-email">{vendor.contact_email}</div>
                          )}
                          {vendor.contact_phone && (
                            <div className="contact-phone">{vendor.contact_phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="table-center">
                        <div className="expense-amount">
                          ${vendor.total_expense_amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="table-center">
                        <span className={`status-badge ${vendor.is_active ? 'active' : 'inactive'}`}>
                          {vendor.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="table-center">
                        <div className="action-buttons">
                          <button 
                            onClick={() => handleEditVendor(vendor)} 
                            className="edit-btn"
                            title="Edit vendor"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 20h9"/>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteVendor(vendor.id, vendor.name)} 
                            className="delete-btn"
                            title="Delete vendor"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3,6 5,6 21,6"/>
                              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                              <line x1="10" y1="11" x2="10" y2="17"/>
                              <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Vendor Form Modal */}
      {showVendorForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && cancelVendorForm()}>
          <div className="modal-content vendor-form-modal">
            <div className="modal-header">
              <h2>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</h2>
              <button onClick={cancelVendorForm} className="close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitVendor} className="vendor-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="vendor-name">Vendor Name *</label>
                  <input
                    id="vendor-name"
                    type="text"
                    value={vendorFormData.name}
                    onChange={(e) => handleVendorFormChange('name', e.target.value)}
                    placeholder="Enter vendor name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="vendor-type">Vendor Type *</label>
                  <select
                    id="vendor-type"
                    value={vendorFormData.vendor_type}
                    onChange={(e) => handleVendorFormChange('vendor_type', e.target.value as any)}
                    required
                  >
                    <option value="utility">Utility Company</option>
                    <option value="maintenance">Maintenance/Repair</option>
                    <option value="grocery">Grocery/Supplies</option>
                    <option value="insurance">Insurance</option>
                    <option value="cleaning">Cleaning Services</option>
                    <option value="landscaping">Landscaping</option>
                    <option value="legal">Legal Services</option>
                    <option value="accounting">Accounting Services</option>
                    <option value="marketing">Marketing/Advertising</option>
                    <option value="property_management">Property Management</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="contact-person">Contact Person</label>
                  <input
                    id="contact-person"
                    type="text"
                    value={vendorFormData.contact_person}
                    onChange={(e) => handleVendorFormChange('contact_person', e.target.value)}
                    placeholder="Primary contact name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-email">Contact Email</label>
                  <input
                    id="contact-email"
                    type="email"
                    value={vendorFormData.contact_email}
                    onChange={(e) => handleVendorFormChange('contact_email', e.target.value)}
                    placeholder="contact@vendor.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-phone">Contact Phone</label>
                  <input
                    id="contact-phone"
                    type="tel"
                    value={vendorFormData.contact_phone}
                    onChange={(e) => handleVendorFormChange('contact_phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tax-id">Tax ID/EIN</label>
                  <input
                    id="tax-id"
                    type="text"
                    value={vendorFormData.tax_id}
                    onChange={(e) => handleVendorFormChange('tax_id', e.target.value)}
                    placeholder="Tax ID or EIN"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="vendor-address">Address</label>
                  <textarea
                    id="vendor-address"
                    rows={2}
                    value={vendorFormData.address}
                    onChange={(e) => handleVendorFormChange('address', e.target.value)}
                    placeholder="Full business address"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="vendor-website">Website</label>
                  <input
                    id="vendor-website"
                    type="url"
                    value={vendorFormData.website}
                    onChange={(e) => handleVendorFormChange('website', e.target.value)}
                    placeholder="https://vendor-website.com"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="vendor-notes">Notes</label>
                  <textarea
                    id="vendor-notes"
                    rows={3}
                    value={vendorFormData.notes}
                    onChange={(e) => handleVendorFormChange('notes', e.target.value)}
                    placeholder="Additional notes about this vendor"
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={vendorFormData.is_active}
                      onChange={(e) => handleVendorFormChange('is_active', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    Active Vendor
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={cancelVendorForm} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingVendor ? 'Update Vendor' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Delete Confirmation Modal */}
      {showVendorDeleteModal && vendorToDelete && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal-content">
            <div className="modal-header">
              <div className="modal-title-section">
                <div className="warning-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0,0 0 1.73-3Z"/>
                    <path d="M12 9v4"/>
                    <path d="m12 17 .01 0"/>
                  </svg>
                </div>
                <div>
                  <h2>Delete Vendor</h2>
                  <p>This action cannot be undone</p>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <p className="delete-message">
                Are you sure you want to delete <strong>"{vendorToDelete.name}"</strong>? 
                This will permanently remove the vendor and all associated data.
              </p>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setShowVendorDeleteModal(false)}
                className="cancel-btn"
                disabled={vendorDeleteLoading}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteVendor} 
                className="delete-confirm-btn"
                disabled={vendorDeleteLoading}
              >
                {vendorDeleteLoading ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                    Delete Vendor
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-container {
          width: 100%;
          background: #f8fafc;
          min-height: calc(100vh - 72px - 58px); /* Full height minus topbar and page header */
          box-sizing: border-box;
        }



        .error-banner,
        .success-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .error-banner {
          background: #fef2f2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .success-banner {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }

        .close-alert {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          font-size: 18px;
          margin-left: auto;
        }

        .vendors-section {
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .section-subtitle {
          color: #6b7280;
          margin: 0;
          font-size: 14px;
        }

        .section-actions {
          display: flex;
          gap: 12px;
        }

        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .refresh-btn:hover {
          background: #e5e7eb;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 200px;
        }

        .empty-state {
          text-align: center;
          padding: 48px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
        }

        .empty-icon {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
          color: #9ca3af;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          color: #6b7280;
          margin: 0 0 24px 0;
        }

        .vendors-table-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .vendors-table {
          width: 100%;
          border-collapse: collapse;
        }

        .vendors-table th,
        .vendors-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .vendors-table th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .table-center {
          text-align: center !important;
        }

        .vendor-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .vendor-name {
          font-weight: 600;
          color: #111827;
        }

        .vendor-id {
          font-size: 12px;
          color: #6b7280;
        }

        .vendor-type-badge {
          display: inline-block;
          padding: 4px 8px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .vendor-contact {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 13px;
        }

        .contact-person {
          font-weight: 500;
          color: #374151;
        }

        .contact-email {
          color: #6b7280;
        }

        .contact-phone {
          color: #6b7280;
        }

        .expense-amount {
          font-weight: 600;
          color: #059669;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          justify-content: center;
        }

        .create-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .create-btn:hover {
          background: #2563eb;
        }

        .edit-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .edit-btn:hover {
          background: #e5e7eb;
        }

        .delete-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .delete-btn:hover {
          background: #fee2e2;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 20px;
        }

        .vendor-form-modal {
          width: 100%;
          max-width: 750px;
          max-height: 75vh;
          overflow-y: auto;
          margin: auto;
        }

        .delete-modal-content {
          width: 100%;
          max-width: 500px;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          padding: 0;
          position: relative;
          z-index: 100000;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px 0;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 20px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #111827;
        }

        .close-btn {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
        }

        .close-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .vendor-form {
          padding: 0 24px 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s ease;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
        }

        .checkbox-label input[type="checkbox"] {
          width: 16px;
          height: 16px;
          margin: 0;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .cancel-btn {
          padding: 10px 16px;
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }

        .cancel-btn:hover {
          background: #e5e7eb;
        }

        .submit-btn {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .submit-btn:hover {
          background: #2563eb;
        }

        .submit-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .modal-title-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .warning-icon {
          color: #f59e0b;
        }

        .modal-section {
          padding: 0 24px 24px;
        }

        .delete-message {
          color: #374151;
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 0 24px 24px;
        }

        .delete-confirm-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #dc2626;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .delete-confirm-btn:hover {
          background: #b91c1c;
        }

        .delete-confirm-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .loading-spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 16px;
          }

          .section-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .section-actions {
            justify-content: flex-start;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .vendors-table-container {
            overflow-x: auto;
          }

          .vendors-table {
            min-width: 600px;
          }

          .modal-overlay {
            padding: 10px;
          }
          
          .vendor-form-modal {
            max-height: 85vh;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}

export default withAuth(Vendors); 