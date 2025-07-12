import React from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import ListingsDashboard from '../components/ListingsDashboard';

export default function ListingsPage() {
  return (
    <DashboardLayout 
      title="Property Listings"
      subtitle="Manage your property listings and applications"
      icon={
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
      }
    >
      <Head>
        <title>Property Listings - Tink Property Management</title>
        <meta name="description" content="Manage your property listings and tenant applications" />
      </Head>
      
      <ListingsDashboard />
    </DashboardLayout>
  );
} 