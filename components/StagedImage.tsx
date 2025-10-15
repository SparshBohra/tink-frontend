import { useState, useEffect } from 'react';
import { Wand2, X, RefreshCw } from 'lucide-react';

interface StagedImageProps {
  originalUrl: string;
  stagedUrl?: string | null;
  mediaId: string;
  alt?: string;
  onStage?: (mediaId: string) => Promise<void>;
  onUnstage?: (mediaId: string) => Promise<void>;
  className?: string;
}

export default function StagedImage({
  originalUrl,
  stagedUrl: propStagedUrl,
  mediaId,
  alt = 'Property image',
  onStage,
  onUnstage,
  className = ''
}: StagedImageProps) {
  const [isStaging, setIsStaging] = useState(false);
  const [showStaged, setShowStaged] = useState(!!propStagedUrl);
  const [error, setError] = useState<string | null>(null);

  // Update showStaged when prop changes
  useEffect(() => {
    if (propStagedUrl) {
      setShowStaged(true);
    }
  }, [propStagedUrl]);

  const handleStage = async () => {
    if (!onStage) return;
    
    setIsStaging(true);
    setError(null);
    
    try {
      await onStage(mediaId);
      // Parent component will update stagedUrl prop
      setShowStaged(true);
    } catch (err: any) {
      setError(err.message || 'Failed to stage image');
      console.error('Staging error:', err);
    } finally {
      setIsStaging(false);
    }
  };

  const handleUnstage = async () => {
    if (!onUnstage) return;
    
    try {
      await onUnstage(mediaId);
      setShowStaged(false);
    } catch (err: any) {
      setError(err.message || 'Failed to remove staging');
      console.error('Unstage error:', err);
    }
  };

  const toggleView = () => {
    setShowStaged(!showStaged);
  };

  const currentUrl = (showStaged && propStagedUrl) ? propStagedUrl : originalUrl;
  const isStaged = !!propStagedUrl;

  return (
    <div className={`staged-image-container ${className}`}>
      <div className="staged-image-wrapper">
        <img
          src={currentUrl}
          alt={alt}
          className="staged-image"
        />
        
        {/* Staged Badge - styled like the wand button */}
        {isStaged && showStaged && (
          <div className="staged-badge">
            <Wand2 size={16} />
            <span>AI Staged</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="staged-actions">
          {isStaged && (
            <button
              onClick={toggleView}
              className="toggle-btn"
              aria-label={showStaged ? "View original photo" : "View staged photo"}
              title={showStaged ? "View original photo" : "View staged photo"}
            >
              <RefreshCw size={18} />
            </button>
          )}
          <button
            onClick={handleStage}
            disabled={isStaging}
            className="stage-btn"
            aria-label={isStaged ? "Regenerate staging" : "Stage with AI"}
            title={isStaged ? "Regenerate with AI — creates a new staged version" : "Stage with AI — adds furniture/lighting without changing layout"}
          >
            {isStaging ? (
              <RefreshCw size={18} className="spin" />
            ) : (
              <Wand2 size={18} />
            )}
          </button>
        </div>

        {/* Loading Overlay */}
        {isStaging && (
          <div className="staging-overlay">
            <div className="staging-spinner">
              <div className="wand-animation">
                <Wand2 size={48} className="wand-icon" />
                <div className="sparkles">
                  <div className="sparkle sparkle-1"></div>
                  <div className="sparkle sparkle-2"></div>
                  <div className="sparkle sparkle-3"></div>
                  <div className="sparkle sparkle-4"></div>
                </div>
              </div>
              <p className="staging-text">Staging with AI...</p>
              <div className="progress-dots">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="staging-error">
            <div className="error-icon">⚠</div>
            <div className="error-content">
              <div className="error-title">Staging Failed</div>
              <div className="error-message">{error}</div>
              <button 
                className="error-retry-btn"
                onClick={() => {
                  setError(null);
                  handleStage();
                }}
              >
                Try Again
              </button>
            </div>
            <button 
              className="error-close-btn"
              onClick={() => setError(null)}
              aria-label="Close error"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .staged-image-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .staged-image-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          border-radius: 8px;
        }

        .staged-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .staged-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(17, 24, 39, 0.9); /* Match wand button background */
          border: 1px solid rgba(0, 0, 0, 0.65); /* Match wand button border */
          color: white;
          padding: 8px 14px;
          border-radius: 10px; /* Rounded square like buttons */
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 7px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12); /* Match wand button shadow */
          z-index: 2;
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
        }

        .staged-actions {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          gap: 8px;
          z-index: 2;
        }

        .stage-btn,
        .toggle-btn,
        .remove-btn {
          background: rgba(255, 255, 255, 2);
          border: 1px solid rgba(0,0,0,0.55);
          border-radius: 10px; /* rounded square */
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        }

        .stage-btn {
          color: #ffffff; /* wand icon white */
          background: rgba(17, 24, 39, 0.9); /* subtle dark translucency */
          border-color: rgba(0,0,0,0.65); /* darker border */
        }

        .stage-btn:hover:not(:disabled) {
          background: rgba(17, 24, 39, 0.4);
          color: #ffffff;
          transform: scale(1.05);
        }

        .stage-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .toggle-btn {
          color: #111827;
          background: rgba(255,255,255,0.85);
        }

        .toggle-btn:hover {
          background: rgba(17,24,39,0.1);
          color: #111827;
          transform: scale(1.05);
        }

        .remove-btn {
          color: #ef4444;
          background: rgba(255,255,255,0.85);
        }

        .remove-btn:hover {
          background: rgba(239,68,68,0.12);
          color: #ef4444;
          transform: scale(1.05);
        }

        .staging-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3;
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .staging-spinner {
          text-align: center;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .wand-animation {
          position: relative;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wand-icon {
          position: relative;
          z-index: 2;
          color: #ffffff;
          filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.6));
          animation: wandFloat 2s ease-in-out infinite;
        }

        @keyframes wandFloat {
          0%, 100% {
            transform: translateY(0px) rotate(-5deg);
          }
          50% {
            transform: translateY(-10px) rotate(5deg);
          }
        }

        .sparkles {
          position: absolute;
          inset: 0;
        }

        .sparkle {
          position: absolute;
          width: 8px;
          height: 8px;
          background: linear-gradient(135deg, #60a5fa, #a78bfa);
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(96, 165, 250, 0.8);
          animation: sparkleFloat 2s ease-in-out infinite;
        }

        .sparkle-1 {
          top: 10%;
          right: 15%;
          animation-delay: 0s;
        }

        .sparkle-2 {
          top: 25%;
          left: 10%;
          animation-delay: 0.5s;
          width: 6px;
          height: 6px;
        }

        .sparkle-3 {
          bottom: 20%;
          right: 20%;
          animation-delay: 1s;
          width: 10px;
          height: 10px;
        }

        .sparkle-4 {
          bottom: 15%;
          left: 15%;
          animation-delay: 1.5s;
        }

        @keyframes sparkleFloat {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 1;
          }
          25% {
            transform: translateY(-15px) scale(1.2);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-20px) scale(0.8);
            opacity: 0.6;
          }
          75% {
            transform: translateY(-10px) scale(1.1);
            opacity: 0.9;
          }
        }

        .staging-text {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.3px;
          color: white;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .progress-dots {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          animation: dotPulse 1.4s ease-in-out infinite;
        }

        .dot:nth-child(1) {
          animation-delay: 0s;
        }

        .dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes dotPulse {
          0%, 80%, 100% {
            transform: scale(1);
            background: rgba(255, 255, 255, 0.4);
          }
          40% {
            transform: scale(1.3);
            background: rgba(255, 255, 255, 1);
          }
        }

        .staging-error {
          position: absolute;
          bottom: 12px;
          left: 12px;
          right: 12px;
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          color: white;
          padding: 16px;
          border-radius: 12px;
          font-size: 13px;
          z-index: 4;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          box-shadow: 0 8px 16px rgba(220, 38, 38, 0.4);
          animation: errorSlideIn 0.3s ease-out;
        }

        @keyframes errorSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .error-icon {
          font-size: 24px;
          line-height: 1;
          flex-shrink: 0;
          animation: errorPulse 1.5s ease-in-out infinite;
        }

        @keyframes errorPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        .error-content {
          flex: 1;
        }

        .error-title {
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .error-message {
          font-size: 12px;
          line-height: 1.5;
          opacity: 0.95;
          margin-bottom: 10px;
        }

        .error-retry-btn {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .error-retry-btn:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-1px);
        }

        .error-close-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          opacity: 0.8;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .error-close-btn:hover {
          opacity: 1;
          transform: scale(1.1);
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

