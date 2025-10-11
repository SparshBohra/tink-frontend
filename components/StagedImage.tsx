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
          {!isStaged && (
            <button
              onClick={handleStage}
              disabled={isStaging}
              className="stage-btn"
              aria-label="Stage with AI"
              title="Stage with AI — adds furniture/lighting without changing layout"
            >
              {isStaging ? (
                <RefreshCw size={18} className="spin" />
              ) : (
                <Wand2 size={18} />
              )}
            </button>
          )}

          {isStaged && (
            <>
              <button
                onClick={toggleView}
                className="toggle-btn"
                title={showStaged ? 'View original photo' : 'View staged photo'}
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={handleUnstage}
                className="remove-btn"
                title="Remove AI staging"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>

        {/* Loading Overlay */}
        {isStaging && (
          <div className="staging-overlay">
            <div className="staging-spinner">
              <Wand2 size={32} className="pulse" />
              <p>Staging with AI...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="staging-error">
            {error}
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
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3;
        }

        .staging-spinner {
          text-align: center;
          color: white;
        }

        .staging-spinner p {
          margin-top: 12px;
          font-size: 14px;
          font-weight: 500;
        }

        .staging-error {
          position: absolute;
          bottom: 12px;
          left: 12px;
          right: 12px;
          background: #ef4444;
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
          z-index: 4;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        .pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}

