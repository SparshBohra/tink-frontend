import { CheckCircle, BarChart3, Home, Eye, MessageSquare, TrendingUp, Building2 } from 'lucide-react';

interface SuccessScreenProps {
  platformCount: number;
  onReset: () => void;
}

export default function SuccessScreen({ platformCount, onReset }: SuccessScreenProps) {
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

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Success Icon */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-2xl mb-6 shadow-lg">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Listing Published Successfully
          </h1>
          <p className="text-xl text-slate-600 mb-2">
            Your property is now live on <span className="font-semibold text-slate-900">{platformCount}</span> platform{platformCount !== 1 ? 's' : ''}
          </p>
          <p className="text-slate-500">
            Estimated reach: <span className="font-semibold">{platformCount * 250}K+ potential tenants</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center">
            <div className="text-3xl font-bold text-slate-900 mb-1">{platformCount}</div>
            <div className="text-sm text-slate-600 mb-2">Active Platforms</div>
            <div className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle className="w-3 h-3" />
              <span>Live</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center">
            <div className="text-3xl font-bold text-slate-900 mb-1">{platformCount * 250}K+</div>
            <div className="text-sm text-slate-600 mb-2">Estimated Reach</div>
            <div className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
              <Eye className="w-3 h-3" />
              <span>Views</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center">
            <div className="text-3xl font-bold text-slate-900 mb-1">24/7</div>
            <div className="text-sm text-slate-600 mb-2">Active Monitoring</div>
            <div className="inline-flex items-center gap-1 text-xs text-purple-600 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>Tracking</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center">
            <div className="text-3xl font-bold text-slate-900 mb-1">&lt;24h</div>
            <div className="text-sm text-slate-600 mb-2">Avg Response</div>
            <div className="inline-flex items-center gap-1 text-xs text-orange-600 font-medium">
              <MessageSquare className="w-3 h-3" />
              <span>Fast</span>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-10 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Dashboard is Ready</h2>
          
          {/* Mock Activity Feed */}
          <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-300">
              <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                Live
              </span>
            </div>
            
            <div className="space-y-4">
              {[
                { text: 'Listing published to Zillow', time: 'Just now' },
                { text: 'SEO optimization complete', time: '1 min ago' },
                { text: 'Images processed and optimized', time: '2 min ago' },
                { text: 'Market analysis completed', time: '3 min ago' },
              ].map((activity, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-slate-200">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{activity.text}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid md:grid-cols-2 gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2">
              <BarChart3 className="w-5 h-5" />
              View Analytics Dashboard
            </button>
            <button
              onClick={onReset}
              className="bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-colors border-2 border-slate-300 flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Create Another Listing
            </button>
          </div>
        </div>

        {/* What's Next Section */}
        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-6">What Happens Next?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex flex-col">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Get Discovered</h4>
              <p className="text-sm text-slate-600">Your listing appears in search results across all selected platforms</p>
            </div>
            <div className="flex flex-col">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Receive Inquiries</h4>
              <p className="text-sm text-slate-600">Potential tenants contact you through our unified messaging system</p>
            </div>
            <div className="flex flex-col">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Track Performance</h4>
              <p className="text-sm text-slate-600">Monitor views, clicks, and engagement with real-time analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
