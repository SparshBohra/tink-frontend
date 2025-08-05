import React from 'react';
import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';
import ListingsDashboard from '../components/ListingsDashboard';

export default function ListingsPage() {
  return (
    <DashboardLayout title="">
      <Head>
        <title>Property Listings - Tink Property Management</title>
        <meta name="description" content="Manage your property listings and tenant applications" />
      </Head>
      
      <ListingsDashboard />
    </DashboardLayout>
  );
} 