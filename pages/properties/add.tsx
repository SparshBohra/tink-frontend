import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../../lib/api';
import Navigation from '../../components/Navigation';
import DashboardLayout from '../../components/DashboardLayout';
import SectionCard from '../../components/SectionCard';
import MetricCard from '../../components/MetricCard';

export default function AddProperty() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    property_type: 'coliving',
    timezone: 'America/New_York'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const newProperty = await apiClient.createProperty(formData);
      setSuccess(`Property "${newProperty.name}" created successfully!`);
      
      // Reset form
      setFormData({
        name: '',
        address: '',
        property_type: 'coliving',
        timezone: 'America/New_York'
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/properties/${newProperty.id}/rooms`);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to create property:', err);
      setError(err.message || 'Failed to create property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      <Head>
        <title>Register New Property - Tink Property Management</title>
      </Head>
      <Navigation />
      
      <DashboardLayout
        title="🏢 Register New Property"
        subtitle="Add a new property to your management portfolio"
      >
        <div className="actions-container">
          <Link href="/properties" className="btn btn-secondary">
            ← Back to Properties
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="metrics-grid">
          <MetricCard 
            title="Property Types" 
            value="4 Available"
            color="blue"
          />
          <MetricCard 
            title="Time Zones" 
            value="6 Supported"
            color="purple"
          />
          <MetricCard 
            title="Next Steps" 
            value="Add Rooms"
            color="green"
          />
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            <strong>Success:</strong> {success}
          </div>
        )}

        {/* Property Form */}
        <SectionCard title="Property Details" subtitle="Enter the basic information for your new property">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">
                  Property Name*
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Downtown Professional Suites"
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">
                  Full Address*
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 123 Main Street, New York, NY 10001"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Property Type*
                </label>
                <select
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  <option value="coliving">Co-Living Space</option>
                  <option value="residential">Residential Property</option>
                  <option value="commercial">Commercial Property</option>
                  <option value="mixed">Mixed Use</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Time Zone*
                </label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Anchorage">Alaska Time (AKT)</option>
                  <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Creating...' : '➕ Register Property'}
              </button>
              <Link href="/properties" className="btn btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </SectionCard>

        {/* Next Steps Guide */}
        <SectionCard title="Next Steps After Creation" subtitle="What to do once your property is registered">
          <div className="steps-grid">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Add Rooms</h4>
                <p>Create individual rooms within your property with specific details and pricing.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Set Rental Rates</h4>
                <p>Configure monthly rent, security deposits, and other fees for each room.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Add Inventory</h4>
                <p>Document furniture, appliances, and other items included with the property.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Manage Tenants</h4>
                <p>Review applications, create leases, and manage tenant relationships.</p>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Quick Actions */}
        <SectionCard title="Quick Actions" subtitle="Other property management tasks">
          <div className="actions-grid">
            <Link href="/properties" className="btn btn-secondary">
              View All Properties
            </Link>
            <Link href="/tenants" className="btn btn-secondary">
              Manage Tenants
            </Link>
            <Link href="/applications" className="btn btn-secondary">
              Review Applications
            </Link>
          </div>
        </SectionCard>
      </DashboardLayout>

      <style jsx>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .form-group.full-width {
          grid-column: 1 / -1;
        }
        
        .form-label {
          font-weight: 600;
          margin-bottom: var(--spacing-sm);
          color: var(--text-primary);
        }
        
        .form-input {
          padding: var(--spacing-md);
          border: 1px solid var(--gray-300);
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          transition: border-color 0.2s ease;
        }
        
        .form-input:focus {
          outline: none;
          border-color: var(--primary-blue);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .form-actions {
          display: flex;
          gap: var(--spacing-md);
          margin-top: var(--spacing-xl);
        }
        
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-lg);
        }
        
        .step-item {
          display: flex;
          gap: var(--spacing-md);
          padding: var(--spacing-lg);
          background: var(--gray-50);
          border-radius: var(--radius-md);
          border: 1px solid var(--gray-200);
        }
        
        .step-number {
          width: 32px;
          height: 32px;
          background: var(--primary-blue);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          flex-shrink: 0;
        }
        
        .step-content h4 {
          margin: 0 0 var(--spacing-xs) 0;
          color: var(--text-primary);
        }
        
        .step-content p {
          margin: 0;
          color: var(--text-secondary);
          font-size: var(--text-small);
        }
        
        .actions-grid {
          display: flex;
          gap: var(--spacing-md);
          flex-wrap: wrap;
        }
        
        .actions-container {
          margin-bottom: var(--spacing-lg);
        }
        
        .alert {
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-lg);
        }
        
        .alert-error {
          background-color: var(--red-50);
          border: 1px solid var(--red-200);
          color: var(--red-800);
        }
        
        .alert-success {
          background-color: var(--green-50);
          border: 1px solid var(--green-200);
          color: var(--green-800);
        }
      `}</style>
    </>
  );
} 