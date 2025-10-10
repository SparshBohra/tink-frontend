import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Circle, Search, Image, FileText, TrendingUp, Sparkles, Target, Building2 } from 'lucide-react';
import { AgentThought } from '../../types/listing-generator';

interface AgentThinkingProps {
  address: string;
  onComplete: () => void;
}

export default function AgentThinking({ address, onComplete }: AgentThinkingProps) {
  const [thoughts, setThoughts] = useState<AgentThought[]>([
    { id: '1', step: 'Address Validation', status: 'pending', message: 'Verifying property location and coordinates', icon: 'search' },
    { id: '2', step: 'Property Discovery', status: 'pending', message: 'Searching listings on Zillow, Apartments.com, Trulia', icon: 'target' },
    { id: '3', step: 'Image Analysis', status: 'pending', message: 'Analyzing property photos with computer vision', icon: 'image' },
    { id: '4', step: 'Market Research', status: 'pending', message: 'Comparing with similar properties in area', icon: 'trending' },
    { id: '5', step: 'Content Generation', status: 'pending', message: 'Writing compelling property description with AI', icon: 'file' },
    { id: '6', step: 'SEO Optimization', status: 'pending', message: 'Optimizing keywords for maximum visibility', icon: 'sparkles' },
  ]);

  const [progress, setProgress] = useState(0);

  const getIcon = (iconName: string, className: string) => {
    const icons: any = {
      search: Search,
      target: Target,
      image: Image,
      trending: TrendingUp,
      file: FileText,
      sparkles: Sparkles,
    };
    const Icon = icons[iconName] || Circle;
    return <Icon className={className} />;
  };

  useEffect(() => {
    let currentIndex = 0;
    const totalSteps = thoughts.length;

    const interval = setInterval(() => {
      if (currentIndex < totalSteps) {
        setThoughts(prev =>
          prev.map((thought, idx) => {
            if (idx === currentIndex) return { ...thought, status: 'processing' };
            if (idx < currentIndex) return { ...thought, status: 'completed' };
            return thought;
          })
        );

        setProgress(((currentIndex + 1) / totalSteps) * 100);

        setTimeout(() => {
          setThoughts(prev =>
            prev.map((thought, idx) =>
              idx === currentIndex ? { ...thought, status: 'completed' } : thought
            )
          );
          currentIndex++;

          if (currentIndex >= totalSteps) {
            clearInterval(interval);
            setTimeout(onComplete, 1000);
          }
        }, 1500);
      }
    }, 1700);

    return () => clearInterval(interval);
  }, [thoughts.length, onComplete]);

  const completedSteps = thoughts.filter(t => t.status === 'completed').length;

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

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6 shadow-lg">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          
          <h2 className="text-4xl font-bold text-slate-900 mb-3">
            AI Agent Processing
          </h2>
          <p className="text-lg text-slate-600 mb-2">{address}</p>
          <p className="text-sm text-slate-500">Estimated time: 30-60 seconds</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">Progress</span>
            <span className="text-sm font-medium text-slate-900">
              {completedSteps} / {thoughts.length} steps completed
            </span>
          </div>
          <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Thought Process */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="space-y-4">
            {thoughts.map((thought, index) => (
              <div 
                key={thought.id} 
                className={`flex items-start gap-4 p-5 rounded-xl transition-all ${
                  thought.status === 'completed' ? 'bg-green-50 border border-green-200' :
                  thought.status === 'processing' ? 'bg-blue-50 border border-blue-200' :
                  'bg-slate-50 border border-slate-200'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {thought.status === 'completed' && (
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                  )}
                  {thought.status === 'processing' && (
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                  {thought.status === 'pending' && (
                    <div className="w-10 h-10 bg-slate-300 rounded-lg flex items-center justify-center">
                      {getIcon(thought.icon || 'circle', 'w-6 h-6 text-slate-500')}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-base mb-1 ${
                    thought.status === 'completed' ? 'text-green-900' :
                    thought.status === 'processing' ? 'text-blue-900' :
                    'text-slate-500'
                  }`}>
                    {thought.step}
                  </h3>
                  <p className={`text-sm ${
                    thought.status === 'pending' ? 'text-slate-500' : 'text-slate-700'
                  }`}>
                    {thought.message}
                  </p>
                </div>

                <div className={`flex-shrink-0 text-lg font-semibold ${
                  thought.status === 'completed' ? 'text-green-600' :
                  thought.status === 'processing' ? 'text-blue-600' :
                  'text-slate-400'
                }`}>
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600">
            Our AI analyzes over 500 data points to create the perfect listing
          </p>
        </div>
      </div>
    </div>
  );
}
