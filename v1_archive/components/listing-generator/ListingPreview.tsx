import { useState } from 'react';
import { Bed, Bath, Maximize2, DollarSign, MapPin, Edit3, Building2, ArrowRight } from 'lucide-react';
import { Property } from '../../types/listing-generator';

interface ListingPreviewProps {
  property: Property;
  onContinue: () => void;
}

export default function ListingPreview({ property, onContinue }: ListingPreviewProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-slate-900">SquareFt<span className="text-blue-600">.ai</span></span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Listing Generated</h1>
          <p className="text-lg text-slate-600">Review and customize your AI-generated listing</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
              {/* Main Image */}
              <div className="relative h-96 bg-slate-900">
                <img
                  src={property.images[selectedImage]}
                  alt={`Property ${selectedImage + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Image Counter */}
                <div className="absolute bottom-4 left-4 px-4 py-2 bg-slate-900/80 backdrop-blur-sm rounded-lg text-white text-sm font-medium">
                  {selectedImage + 1} / {property.images.length}
                </div>
              </div>

              {/* Thumbnail Grid */}
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <div className="grid grid-cols-4 gap-3">
                  {property.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`relative h-20 rounded-lg overflow-hidden transition-all ${
                        selectedImage === idx 
                          ? 'ring-2 ring-blue-600' 
                          : 'ring-1 ring-slate-300 hover:ring-slate-400'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
              <div className="flex items-start justify-between mb-8">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">{property.address}</h2>
                  <div className="flex items-center text-slate-600">
                    <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                    <span>Prime Location</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mb-8 pb-8 border-b border-slate-200">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <Bed className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-slate-900">{property.bedrooms}</p>
                  <p className="text-xs text-slate-600 mt-1">Bedrooms</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <Bath className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-slate-900">{property.bathrooms}</p>
                  <p className="text-xs text-slate-600 mt-1">Bathrooms</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <Maximize2 className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-slate-900">{property.squareFeet.toLocaleString()}</p>
                  <p className="text-xs text-slate-600 mt-1">Sq Ft</p>
                </div>
                <div className="text-center p-4 bg-blue-600 rounded-xl">
                  <DollarSign className="w-6 h-6 text-white mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">${property.rent.toLocaleString()}</p>
                  <p className="text-xs text-blue-100 mt-1">Per Month</p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8 pb-8 border-b border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">AI-Generated Description</h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                    Optimized
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">{property.description}</p>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Amenities</h3>
                <div className="grid grid-cols-2 gap-3">
                  {property.amenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-slate-700">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* CTA Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200 sticky top-6">
              <h3 className="text-xl font-bold text-slate-900 mb-3">Ready to Publish?</h3>
              <p className="text-slate-600 mb-6">
                Your listing is optimized and ready to reach thousands of potential tenants
              </p>

              <button
                onClick={onContinue}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors mb-6 flex items-center justify-center gap-2"
              >
                Continue to Publishing
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-600 text-center">
                  Free to review • No credit card required
                </p>
              </div>
            </div>

            {/* AI Quality Score */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-5">AI Quality Analysis</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Description Quality</span>
                    <span className="text-sm font-bold text-slate-900">98%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '98%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Photo Quality</span>
                    <span className="text-sm font-bold text-slate-900">95%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Market Positioning</span>
                    <span className="text-sm font-bold text-slate-900">92%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-300">
                <p className="text-sm text-slate-700">
                  This listing performs better than 87% of similar properties in your area
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
