import React, { useState } from 'react';
import { TenantProfileData } from '../lib/types';

interface TenantProfileSelectorProps {
  tenantProfiles: TenantProfileData[];
  phoneNumber: string;
  onProfileSelect: (tenantUserId: number) => void;
  loading?: boolean;
}

const TenantProfileSelector: React.FC<TenantProfileSelectorProps> = ({
  tenantProfiles,
  phoneNumber,
  onProfileSelect,
  loading = false
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);

  const handleProfileSelect = (tenantUserId: number) => {
    setSelectedProfileId(tenantUserId);
    onProfileSelect(tenantUserId);
  };

  const formatCurrency = (amount: number | undefined): string => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
          <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Select Your Property
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          You have multiple rental properties. Please select which one you want to access.
        </p>
        <p className="mt-1 text-center text-xs text-gray-500">
          Phone: {phoneNumber}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-4">
            {tenantProfiles.map((profile) => (
              <button
                key={profile.tenant_user_id}
                onClick={() => handleProfileSelect(profile.tenant_user_id)}
                disabled={loading}
                className={`w-full text-left p-4 border rounded-lg transition-all duration-200 ${
                  selectedProfileId === profile.tenant_user_id
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V9.75a.75.75 0 00-.75-.75h-10.5a.75.75 0 00-.75.75v11.25m19.5 0A2.25 2.25 0 0019.5 21h-15A2.25 2.25 0 002.25 21V9.75m19.5 0v-9A2.25 2.25 0 0019.5 2.25h-15A2.25 2.25 0 002.25 2.25v9m19.5 0a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 002.25 9.75v9z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {profile.property_name || 'Property Name Not Available'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {profile.property_address || 'Address not available'}
                        </p>
                        <div className="flex items-center mt-2">
                          <span className="text-xs text-gray-500">Landlord:</span>
                          <span className="ml-1 text-xs font-medium text-gray-700">
                            {profile.landlord_name || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(profile.monthly_rent)}
                    </p>
                    <p className="text-xs text-gray-500">per month</p>
                  </div>
                </div>

                {selectedProfileId === profile.tenant_user_id && (
                  <div className="mt-3 flex items-center">
                    <div className="flex-shrink-0">
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      ) : (
                        <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    <span className="ml-2 text-xs text-indigo-600 font-medium">
                      {loading ? 'Logging in...' : 'Selected'}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Need help? Contact your landlord or property manager.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantProfileSelector; 