import React, { useState } from 'react';
import Head from 'next/head';
import AddressInput from '../components/listing-generator/AddressInput';
import AgentThinking from '../components/listing-generator/AgentThinking';
import ListingPreview from '../components/listing-generator/ListingPreview';
import PlatformIntegration from '../components/listing-generator/PlatformIntegration';
import AuthModal from '../components/listing-generator/AuthModal';
import SuccessScreen from '../components/listing-generator/SuccessScreen';
import { Property, AppState } from '../types/listing-generator';

export default function LandingPage() {
  const [currentState, setCurrentState] = useState<AppState>('input');
  const [address, setAddress] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Mock property data - this would come from your backend API
  const mockProperty: Property = {
    id: '1',
    address: address || '123 Main St, San Francisco, CA 94102',
    bedrooms: 3,
    bathrooms: 2.5,
    squareFeet: 1850,
    rent: 4500,
    description: `Discover modern living in this beautifully renovated 3-bedroom, 2.5-bathroom apartment in the heart of San Francisco. This spacious home features an open-concept living area with hardwood floors throughout, floor-to-ceiling windows that flood the space with natural light, and a chef's kitchen equipped with premium stainless steel appliances and elegant granite countertops. 

The master suite offers a luxurious private bathroom with dual vanities and a walk-in closet with custom built-ins, while two additional bedrooms provide perfect flexibility for guests, a home office, or children's rooms. 

Located in a vibrant and highly sought-after neighborhood, you'll enjoy easy access to public transportation, world-class restaurants, trendy cafes, boutique shops, and beautiful parks. This property combines modern comfort, sophisticated style, and unbeatable urban convenience for an exceptional Bay Area living experience.`,
    amenities: [
      'In-unit Washer & Dryer',
      'Central Air Conditioning & Heating',
      'Hardwood Floors Throughout',
      'Granite Countertops',
      'Stainless Steel Appliances',
      'Walk-in Closets',
      'Private Parking Garage',
      'Pet Friendly (Cats & Dogs)',
      'Fitness Center Access',
      'Secured Building Entry',
      'High-Speed Internet Ready',
      'Storage Unit Included',
    ],
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800&h=600&fit=crop',
    ],
    latitude: 37.7749,
    longitude: -122.4194,
  };

  const handleAddressSubmit = (submittedAddress: string) => {
    setAddress(submittedAddress);
    setCurrentState('thinking');
  };

  const handleThinkingComplete = () => {
    setCurrentState('preview');
  };

  const handlePreviewContinue = () => {
    setCurrentState('platforms');
  };

  const handleGoLive = () => {
    setShowAuthModal(true);
  };

  const handleAuthClick = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setCurrentState('success');
  };

  const handleReset = () => {
    setAddress('');
    setCurrentState('input');
  };

  return (
    <>
      <Head>
        <title>SquareFt.ai - AI-Powered Property Listing Generator</title>
        <meta 
          name="description" 
          content="Create professional property listings in 60 seconds with AI. Publish to Zillow, Apartments.com, and more instantly." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {currentState === 'input' && (
        <AddressInput onSubmit={handleAddressSubmit} onAuthClick={handleAuthClick} />
      )}
      
      {currentState === 'thinking' && (
        <AgentThinking address={address} onComplete={handleThinkingComplete} />
      )}
      
      {currentState === 'preview' && (
        <ListingPreview 
          property={{ ...mockProperty, address: address || mockProperty.address }} 
          onContinue={handlePreviewContinue} 
        />
      )}
      
      {currentState === 'platforms' && (
        <PlatformIntegration onGoLive={handleGoLive} />
      )}
      
      {currentState === 'success' && (
        <SuccessScreen platformCount={3} onReset={handleReset} />
      )}
      
      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onSuccess={handleAuthSuccess} 
        />
      )}
    </>
  );
}
