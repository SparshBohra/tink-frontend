'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { 
  MapPin, Bed, Bath, Maximize, Calendar, DollarSign,
  Share2, Download, Wand2, ArrowLeft, Loader2,
  Home, Car, Zap, Droplet, WashingMachine, PawPrint
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface Listing {
  listing_id: string;
  source: {
    platform: string;
    url: string;
    provider_listing_id: string;
  };
  title: string;
  description: string;
  ai_description: string;
  address: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zipcode: string;
    country: string;
    full_address: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  pricing: {
    status: string;
    price: number;
    currency: string;
    price_per_sqft?: number;
    rent_estimate?: number;
    lease_term?: string;
    availability_date?: string;
    deposit?: number;
    application_fee?: number;
    other_fees: any[];
  };
  property_details: {
    type: string;
    year_built?: number;
    bedrooms: number;
    bathrooms: number;
    living_area_sqft?: number;
    lot_size_sqft?: number;
    stories?: number;
    parking: {
      type?: string;
      spaces?: number;
    };
    amenities: string[];
    pets_allowed: string[];
    heating: string[];
    cooling: string[];
    laundry: string[];
  };
  media: {
    thumbnail: string;
    photos: string[];
    videos: any[];
    floorplans: any[];
    virtual_tour?: string;
  };
  status: string;
  created_at: string;
  updated_at: string;
}

export default function ListingPage() {
  const router = useRouter();
  const { id } = router.query;
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [useAIDescription, setUseAIDescription] = useState(true);

  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [id]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getListing(id as string);
      setListing(data);
      setError('');
    } catch (err: any) {
      console.error('Error fetching listing:', err);
      setError(err.message || 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Listing not found'}</p>
          <Link href="/" className="text-indigo-600 hover:underline">
            ← Back to search
          </Link>
        </div>
      </div>
    );
  }

  const photos = listing.media?.photos || [];
  const amenities = listing.property_details?.amenities || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>New Search</span>
          </Link>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors">
              <Share2 size={18} />
              <span>Share</span>
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors">
              <Download size={18} />
              <span>Export</span>
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md">
              Go Live
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{listing.title}</h1>
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <MapPin size={20} />
            <span className="text-lg">{listing.address.full_address}</span>
          </div>
          {listing.source?.platform && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
              <span>Source: {listing.source.platform}</span>
            </div>
          )}
        </div>

        {/* Photos */}
        {photos.length > 0 && (
          <div className="mb-8">
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-4 bg-gray-200 shadow-lg">
              <img
                src={photos[selectedImage]}
                alt="Property"
                className="w-full h-full object-cover"
              />
            </div>

            {photos.length > 1 && (
              <div className="grid grid-cols-6 gap-3">
                {photos.slice(0, 6).map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-3 transition-all ${
                      idx === selectedImage 
                        ? 'border-indigo-600 ring-2 ring-indigo-200' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price & Stats */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="text-4xl font-bold text-indigo-600 mb-6">
                {formatPrice(listing.pricing.price)}
                <span className="text-lg text-gray-600 font-normal">/month</span>
              </div>
              
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <Bed className="text-indigo-600" size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{listing.property_details.bedrooms}</div>
                    <div className="text-sm text-gray-600">Bedrooms</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Bath className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{listing.property_details.bathrooms}</div>
                    <div className="text-sm text-gray-600">Bathrooms</div>
                  </div>
                </div>
                
                {listing.property_details.living_area_sqft && (
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Maximize className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {listing.property_details.living_area_sqft.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Sq Ft</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                {listing.property_details.type && (
                  <div className="flex items-center gap-2">
                    <Home size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-700">Type: {listing.property_details.type}</span>
                  </div>
                )}
                {listing.property_details.year_built && (
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-700">Built: {listing.property_details.year_built}</span>
                  </div>
                )}
                {listing.property_details.parking?.type && (
                  <div className="flex items-center gap-2">
                    <Car size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {listing.property_details.parking.type} 
                      {listing.property_details.parking.spaces && ` (${listing.property_details.parking.spaces})`}
                    </span>
                  </div>
                )}
                {listing.pricing.deposit && (
                  <div className="flex items-center gap-2">
                    <DollarSign size={18} className="text-gray-400" />
                    <span className="text-sm text-gray-700">Deposit: {formatPrice(listing.pricing.deposit)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Description</h2>
                {listing.ai_description && listing.description && (
                  <button
                    onClick={() => setUseAIDescription(!useAIDescription)}
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <Wand2 size={16} />
                    <span>{useAIDescription ? 'Show Original' : 'Show AI Version'}</span>
                  </button>
                )}
              </div>
              
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {useAIDescription && listing.ai_description 
                  ? listing.ai_description 
                  : listing.description || 'No description available'}
              </p>
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-4">Amenities</h2>
                <div className="grid grid-cols-2 gap-3">
                  {amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold mb-4">Features</h2>
              <div className="grid grid-cols-2 gap-4">
                {listing.property_details.heating?.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Zap className="text-orange-500" size={20} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Heating</div>
                      <div className="text-sm text-gray-600">{listing.property_details.heating.join(', ')}</div>
                    </div>
                  </div>
                )}
                {listing.property_details.cooling?.length > 0 && (
                  <div className="flex items-center gap-3">
                    <Droplet className="text-blue-500" size={20} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Cooling</div>
                      <div className="text-sm text-gray-600">{listing.property_details.cooling.join(', ')}</div>
                    </div>
                  </div>
                )}
                {listing.property_details.laundry?.length > 0 && (
                  <div className="flex items-center gap-3">
                    <WashingMachine className="text-purple-500" size={20} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Laundry</div>
                      <div className="text-sm text-gray-600">{listing.property_details.laundry.join(', ')}</div>
                    </div>
                  </div>
                )}
                {listing.property_details.pets_allowed?.length > 0 && (
                  <div className="flex items-center gap-3">
                    <PawPrint className="text-green-500" size={20} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Pets</div>
                      <div className="text-sm text-gray-600">{listing.property_details.pets_allowed.join(', ')}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h3 className="text-lg font-bold mb-4">Actions</h3>
              
              <div className="space-y-3">
                <button className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-md flex items-center justify-center gap-2">
                  <Wand2 size={18} />
                  <span>Stage Photos with AI</span>
                </button>
                
                <button className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md">
                  Publish to Platforms
                </button>
                
                <button className="w-full px-6 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <Download size={18} />
                  <span>Export as PDF</span>
                </button>
                
                <button className="w-full px-6 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  Edit Listing
                </button>
              </div>

              {/* Status */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="text-sm text-gray-600 mb-2">Status</div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="capitalize">{listing.status}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

