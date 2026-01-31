import React, { useState } from 'react';
import { X, User, Building2, Lock, Check, Loader2 } from 'lucide-react';
import { useSupabaseAuth } from '../lib/supabase-auth-context';
import { supabase } from '../lib/supabase';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { profile, organization, user, refreshProfile } = useSupabaseAuth();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'security'>('profile');
  
  // Profile form
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  
  // Organization form
  const [orgName, setOrgName] = useState(organization?.name || '');
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showMessage = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setSuccess(null);
    } else {
      setSuccess(msg);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 3000);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
      showMessage('User not found', true);
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Refresh the profile in the auth context
      await refreshProfile();
      showMessage('Profile updated successfully');
    } catch (err: any) {
      console.error('Profile update error:', err);
      showMessage(err.message || 'Failed to update profile', true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOrganization = async () => {
    if (!organization?.id) {
      showMessage('Organization not found', true);
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ name: orgName })
        .eq('id', organization.id);
      
      if (error) throw error;
      
      // Refresh to get updated org data
      await refreshProfile();
      showMessage('Organization updated successfully');
    } catch (err: any) {
      console.error('Organization update error:', err);
      showMessage(err.message || 'Failed to update organization', true);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showMessage('Passwords do not match', true);
      return;
    }
    
    if (newPassword.length < 6) {
      showMessage('Password must be at least 6 characters', true);
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showMessage('Password updated successfully');
    } catch (err: any) {
      showMessage(err.message || 'Failed to update password', true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Tabs */}
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} />
              Profile
            </button>
            <button 
              className={`tab ${activeTab === 'organization' ? 'active' : ''}`}
              onClick={() => setActiveTab('organization')}
            >
              <Building2 size={18} />
              Organization
            </button>
            <button 
              className={`tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Lock size={18} />
              Security
            </button>
          </div>

          {/* Messages */}
          {success && (
            <div className="message success">
              <Check size={16} /> {success}
            </div>
          )}
          {error && (
            <div className="message error">
              {error}
            </div>
          )}

          {/* Content */}
          <div className="tab-content">
            {activeTab === 'profile' && (
              <div className="form-section">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    value={email}
                    disabled
                    className="disabled"
                  />
                  <span className="hint">Email cannot be changed</span>
                </div>
                <button 
                  className="save-btn" 
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? <Loader2 size={18} className="spinning" /> : 'Save Changes'}
                </button>
              </div>
            )}

            {activeTab === 'organization' && (
              <div className="form-section">
                <div className="form-group">
                  <label>Organization Name</label>
                  <input 
                    type="text" 
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Enter organization name"
                  />
                </div>
                <button 
                  className="save-btn" 
                  onClick={handleSaveOrganization}
                  disabled={saving}
                >
                  {saving ? <Loader2 size={18} className="spinning" /> : 'Save Changes'}
                </button>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="form-section">
                <h3>Change Password</h3>
                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <button 
                  className="save-btn" 
                  onClick={handleChangePassword}
                  disabled={saving || !newPassword || !confirmPassword}
                >
                  {saving ? <Loader2 size={18} className="spinning" /> : 'Update Password'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
          padding-top: 80px;
        }

        .modal-content {
          background: white;
          width: 90%;
          max-width: 560px;
          max-height: calc(100vh - 120px);
          border-radius: 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-header {
          padding: 24px 28px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .close-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .modal-body {
          padding: 24px 28px 32px;
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          background: #f8fafc;
          padding: 6px;
          border-radius: 14px;
        }

        .tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab:hover {
          color: #0f172a;
        }

        .tab.active {
          background: white;
          color: #0f172a;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .message {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }

        .message.success {
          background: #ecfdf5;
          color: #059669;
        }

        .message.error {
          background: #fef2f2;
          color: #dc2626;
        }

        .form-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 20px 0;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 8px;
        }

        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .form-group input.disabled {
          background: #f8fafc;
          color: #94a3b8;
          cursor: not-allowed;
        }

        .hint {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 6px;
          display: block;
        }

        .save-btn {
          width: 100%;
          padding: 14px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .save-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .save-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        :global(.spinning) {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
