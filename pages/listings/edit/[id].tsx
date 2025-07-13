import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '../../../lib/api';
import NewListingModal from '../../../components/NewListingModal';

interface NewListingModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  editMode?: boolean;
  existingListing?: any;
}

const EditListingPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchListing();
    }
  }, [id]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const listingData = await apiClient.getListing(parseInt(id as string));
      console.log('Fetched listing data for editing:', listingData);
      setListing(listingData);
    } catch (error) {
      console.error('Failed to fetch listing:', error);
      setError('Failed to load listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSuccess = () => {
    router.push('/listings');
  };

  const handleClose = () => {
    router.push('/listings');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #4f46e5',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Loading listing...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <p style={{ color: '#ef4444' }}>{error}</p>
        <button 
          onClick={() => router.push('/listings')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Back to Listings
        </button>
      </div>
    );
  }

  return (
    <NewListingModal 
      onClose={handleClose}
      onSuccess={handleUpdateSuccess}
      editMode={true}
      existingListing={listing}
    />
  );
};

export default EditListingPage; 