import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  showMessage?: boolean;
}

export default function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'medium', 
  fullScreen = false,
  showMessage = true 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'loading-small',
    medium: 'loading-medium', 
    large: 'loading-large'
  };

  return (
    <div className={`loading-container ${fullScreen ? 'fullscreen' : ''}`}>
      <div className="loading-content">
        <div className={`loading-spinner ${sizeClasses[size]}`}>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        {showMessage && (
          <div className="loading-message">
            <span className="loading-text">{message}</span>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          min-height: 200px;
          position: relative;
        }

        .loading-container.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(4px);
          z-index: 9999;
          min-height: 100vh;
        }

        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 20px;
        }

        .loading-spinner {
          position: relative;
          display: inline-block;
        }

        .loading-small {
          width: 32px;
          height: 32px;
        }

        .loading-medium {
          width: 48px;
          height: 48px;
        }

        .loading-large {
          width: 64px;
          height: 64px;
        }

        .spinner-ring {
          position: absolute;
          border: 3px solid transparent;
          border-radius: 50%;
          animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        }

        .loading-small .spinner-ring {
          width: 32px;
          height: 32px;
          border-width: 2px;
        }

        .loading-medium .spinner-ring {
          width: 48px;
          height: 48px;
          border-width: 3px;
        }

        .loading-large .spinner-ring {
          width: 64px;
          height: 64px;
          border-width: 4px;
        }

        .spinner-ring:nth-child(1) {
          border-top-color: #3b82f6;
          animation-delay: -0.45s;
        }

        .spinner-ring:nth-child(2) {
          border-top-color: #8b5cf6;
          animation-delay: -0.3s;
        }

        .spinner-ring:nth-child(3) {
          border-top-color: #06b6d4;
          animation-delay: -0.15s;
        }

        .spinner-ring:nth-child(4) {
          border-top-color: #10b981;
          animation-delay: 0s;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
          100% {
            transform: rotate(360deg);
            opacity: 1;
          }
        }

        .loading-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .loading-text {
          font-size: 16px;
          font-weight: 500;
          color: #374151;
          letter-spacing: 0.025em;
        }

        .loading-dots {
          display: flex;
          gap: 4px;
        }

        .loading-dots span {
          width: 6px;
          height: 6px;
          background: #9ca3af;
          border-radius: 50%;
          animation: bounce 1.4s ease-in-out infinite both;
        }

        .loading-dots span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .loading-dots span:nth-child(2) {
          animation-delay: -0.16s;
        }

        .loading-dots span:nth-child(3) {
          animation-delay: 0s;
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1.2);
            opacity: 1;
          }
        }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .loading-container {
            min-height: 150px;
          }

          .loading-content {
            gap: 16px;
          }

          .loading-text {
            font-size: 14px;
          }

          .loading-small {
            width: 28px;
            height: 28px;
          }

          .loading-medium {
            width: 40px;
            height: 40px;
          }

          .loading-large {
            width: 56px;
            height: 56px;
          }

          .loading-small .spinner-ring {
            width: 28px;
            height: 28px;
          }

          .loading-medium .spinner-ring {
            width: 40px;
            height: 40px;
          }

          .loading-large .spinner-ring {
            width: 56px;
            height: 56px;
          }
        }
      `}</style>
    </div>
  );
} 