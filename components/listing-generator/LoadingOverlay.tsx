import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface LoadingOverlayProps {
  onClose: () => void;
  onComplete: () => void;
  isLoading?: boolean;
}

interface ThinkingStep {
  id: number;
  text: string;
  status: 'pending' | 'active' | 'complete';
}

export default function LoadingOverlay({ onClose, onComplete, isLoading = true }: LoadingOverlayProps) {
  const [steps, setSteps] = useState<ThinkingStep[]>([
    { id: 1, text: 'Analyzing property address...', status: 'pending' },
    { id: 2, text: 'Scraping property details...', status: 'pending' },
    { id: 3, text: 'Gathering media and photos...', status: 'pending' },
    { id: 4, text: 'Preparing listing description...', status: 'pending' },
    { id: 5, text: 'Finalizing your listing...', status: 'pending' },
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('Analyzing property address...');
  const [startTime] = useState(Date.now());

  useEffect(() => {
    // API call completed - finish all steps and transition immediately
    if (!isLoading) {
      const completeAllSteps = () => {
        setSteps(prev => prev.map(step => ({ ...step, status: 'complete' })));
        setCurrentStep(steps.length);
        // Reduced delay for faster transition
        setTimeout(() => {
          onComplete();
        }, 400);
      };
      completeAllSteps();
      return;
    }

    // API still loading - animate through steps with faster timing
    if (currentStep < steps.length && isLoading) {
      // Calculate step duration based on elapsed time
      const elapsed = Date.now() - startTime;
      const remainingSteps = steps.length - currentStep;
      
      // Step duration - 1500ms per step
      // This gives ~7.5 seconds total if API is fast, but can extend if API is slow
      const baseStepDuration = 1500; // 1500ms per step (1.5 seconds)
      const minStepDuration = 1000; // Minimum 1 second
      const maxStepDuration = 2500; // Maximum 2.5 seconds
      
      // If API is taking longer than expected, slow down the steps
      let stepDuration = baseStepDuration;
      if (elapsed > 8000 && remainingSteps > 0) {
        // If we've been waiting > 8s and have steps remaining, slow down
        stepDuration = Math.min(maxStepDuration, baseStepDuration * 1.5);
      }
      
      // First, set step to active immediately
      const activateTimer = setTimeout(() => {
        setSteps(prev => prev.map((step, idx) => {
          if (idx === currentStep) return { ...step, status: 'active' };
          if (idx < currentStep) return { ...step, status: 'complete' };
          return step;
        }));
        setCurrentMessage(steps[currentStep].text);
        
        // For the last step, don't auto-complete - wait for API
        if (currentStep === steps.length - 1) {
          // Keep last step active until API completes
          return;
        }
        
        // Then, after the step duration, complete it and move to next
        const completeTimer = setTimeout(() => {
          setSteps(prev => prev.map((step, idx) => {
            if (idx === currentStep) return { ...step, status: 'complete' };
            return step;
          }));
          setCurrentStep(currentStep + 1);
        }, stepDuration);
        
        return () => clearTimeout(completeTimer);
      }, 100); // Reduced initial delay from 300ms to 100ms

      return () => clearTimeout(activateTimer);
    }
  }, [currentStep, steps.length, onComplete, isLoading, startTime, steps]);

  return (
    <div className="loading-overlay">
      <button onClick={onClose} className="close-button" aria-label="Close">
        <X size={28} />
      </button>

      <div className="loading-content">
        {/* Professional Modern Loader */}
        <div className="modern-loader">
          <div className="loader-ring"></div>
          <div className="loader-ring"></div>
          <div className="loader-ring"></div>
          <div className="loader-core">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="steps-container">
          {steps.map((step) => (
            <div key={step.id} className={`step-item ${step.status}`}>
              <div className="step-icon">
                {step.status === 'complete' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : step.status === 'active' ? (
                  <div className="spinner"></div>
                ) : (
                  <div className="pending-dot"></div>
                )}
              </div>
              <span className="step-label">{step.text}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .loading-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, rgba(15, 23, 42, 0.75) 0%, rgba(15, 23, 42, 0.85) 50%, rgba(0, 0, 0, 0.95) 100%);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          animation: fadeIn 0.4s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .close-button {
          position: fixed;
          top: 32px;
          right: 32px;
          z-index: 10000;
          background: rgba(30, 41, 59, 20);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: white;
          transition: all 0.3s;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .close-button:hover {
          background: rgba(30, 41, 59, 0.95);
          border-color: rgba(255, 255, 255, 0.5);
          color: white;
          transform: scale(1.08);
        }

        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 40px;
          animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
          max-width: 500px;
          width: 90%;
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.85);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* Professional Modern Loader */
        .modern-loader {
          width: 140px;
          height: 140px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loader-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 3px solid transparent;
        }

        .loader-ring:nth-child(1) {
          border-top-color: #1877F2;
          animation: rotate 1.5s linear infinite;
        }

        .loader-ring:nth-child(2) {
          width: 85%;
          height: 85%;
          border-right-color: #60a5fa;
          animation: rotate 2s linear infinite reverse;
        }

        .loader-ring:nth-child(3) {
          width: 70%;
          height: 70%;
          border-bottom-color: #93c5fd;
          animation: rotate 2.5s linear infinite;
        }

        @keyframes rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .loader-core {
          position: relative;
          z-index: 10;
          width: 64px;
          height: 64px;
          background: rgba(24, 119, 242, 0.9);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          animation: pulse 2s ease-in-out infinite;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 2px solid rgba(24, 119, 242, 1);
          box-shadow: 0 8px 32px rgba(24, 119, 242, 0.6);
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 8px 32px rgba(24, 119, 242, 0.25);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 12px 40px rgba(24, 119, 242, 0.4);
          }
        }

        /* Steps Container */
        .steps-container {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
        }

        .step-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          border-radius: 12px;
          background: rgba(30, 41, 59, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
          animation: slideInStep 0.4s ease-out backwards;
        }

        .step-item:nth-child(1) { animation-delay: 0.1s; }
        .step-item:nth-child(2) { animation-delay: 0.15s; }
        .step-item:nth-child(3) { animation-delay: 0.2s; }
        .step-item:nth-child(4) { animation-delay: 0.25s; }
        .step-item:nth-child(5) { animation-delay: 0.3s; }

        @keyframes slideInStep {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .step-item.active {
          background: rgba(24, 119, 242, 0.85);
          border-color: rgba(24, 119, 242, 1);
          box-shadow: 0 0 0 2px rgba(24, 119, 242, 0.4);
        }

        .step-item.complete {
          background: rgba(16, 185, 129, 0.85);
          border-color: rgba(16, 185, 129, 1);
        }

        .step-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .step-item.complete .step-icon {
          color: #ffffff;
          animation: checkPop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes checkPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .step-item.active .step-icon {
          color: #ffffff;
        }

        .pending-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .step-label {
          font-size: 15px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
          transition: color 0.3s;
        }

        .step-item.active .step-label {
          color: white;
          font-weight: 600;
        }

        .step-item.complete .step-label {
          color: white;
        }

        @media (max-width: 768px) {
          .close-button {
            top: 20px;
            right: 20px;
            width: 44px;
            height: 44px;
          }

          .modern-loader {
            width: 110px;
            height: 110px;
          }

          .loader-core {
            width: 52px;
            height: 52px;
          }

          .loader-core svg {
            width: 26px;
            height: 26px;
          }

          .loading-content {
            gap: 32px;
            width: 95%;
          }

          .step-item {
            padding: 12px 16px;
            gap: 12px;
          }

          .step-label {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}

