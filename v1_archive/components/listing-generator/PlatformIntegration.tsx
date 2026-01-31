import { useState } from 'react';
import { Check, ExternalLink, Building2, ArrowRight } from 'lucide-react';
import { Platform } from '../../types/listing-generator';

interface PlatformIntegrationProps {
  onGoLive: () => void;
}

export default function PlatformIntegration({ onGoLive }: PlatformIntegrationProps) {
  const [platforms, setPlatforms] = useState<Platform[]>([
    { 
      id: '1', 
      name: 'Zillow', 
      icon: '', 
      connected: false, 
      color: 'border-blue-200 hover:border-blue-400',
      description: '150M+ monthly visitors'
    },
    { 
      id: '2', 
      name: 'Apartments.com', 
      icon: '', 
      connected: false, 
      color: 'border-orange-200 hover:border-orange-400',
      description: '40M+ monthly visitors'
    },
    { 
      id: '3', 
      name: 'Rent.com', 
      icon: '', 
      connected: false, 
      color: 'border-green-200 hover:border-green-400',
      description: '25M+ monthly visitors'
    },
    { 
      id: '4', 
      name: 'Trulia', 
      icon: '', 
      connected: false, 
      color: 'border-teal-200 hover:border-teal-400',
      description: '35M+ monthly visitors'
    },
    { 
      id: '5', 
      name: 'Facebook Marketplace', 
      icon: '', 
      connected: false, 
      color: 'border-indigo-200 hover:border-indigo-400',
      description: '1B+ active users'
    },
    { 
      id: '6', 
      name: 'SquareFt Public Page', 
      icon: '', 
      connected: false, 
      color: 'border-purple-200 hover:border-purple-400',
      description: 'Your branded listing page'
    },
  ]);

  const togglePlatform = (id: string) => {
    setPlatforms(prev =>
      prev.map(p => p.id === id ? { ...p, connected: !p.connected } : p)
    );
  };

  const selectedCount = platforms.filter(p => p.connected).length;
  const totalReach = selectedCount * 250;

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

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Select Publishing Platforms</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Choose where you want to publish your listing. You can select multiple platforms to maximize your reach.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Platform Cards */}
          <div className="lg:col-span-2">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                    platform.connected
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : `${platform.color} bg-white`
                  }`}
                >
                  {/* Connected Checkmark */}
                  {platform.connected && (
                    <div className="absolute top-4 right-4 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="font-bold text-lg text-slate-900 mb-1">{platform.name}</h3>
                    <p className="text-sm text-slate-600">{platform.description}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ExternalLink className="w-4 h-4" />
                    <span className={platform.connected ? 'text-blue-600' : 'text-slate-600'}>
                      {platform.connected ? 'Connected' : 'Click to connect'}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Info Section */}
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-6 text-lg">What's Included</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  'Automatic content optimization for each platform',
                  'Real-time sync across all platforms',
                  'Unified analytics dashboard',
                  'Lead management system',
                  'Multi-platform messaging inbox',
                  'Performance tracking and insights'
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publishing Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200 sticky top-6">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Publishing Summary</h3>

              <div className="space-y-6 mb-8">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                  <span className="text-slate-600">Selected Platforms</span>
                  <span className="text-2xl font-bold text-slate-900">{selectedCount}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                  <span className="text-slate-600">Estimated Reach</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {totalReach}K+
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Response Time</span>
                  <span className="text-xl font-bold text-slate-900">~24hrs</span>
                </div>
              </div>

              {selectedCount > 0 ? (
                <button
                  onClick={onGoLive}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors mb-4 flex items-center justify-center gap-2"
                >
                  Publish to {selectedCount} Platform{selectedCount !== 1 ? 's' : ''}
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-slate-200 text-slate-500 font-semibold py-3 px-6 rounded-xl cursor-not-allowed mb-4"
                >
                  Select at least one platform
                </button>
              )}

              <p className="text-xs text-slate-500 text-center">
                You can add or remove platforms later
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
