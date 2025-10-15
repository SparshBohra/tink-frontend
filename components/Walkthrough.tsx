import { useState, useEffect } from 'react';
import { X, ArrowRight, Wand2 } from 'lucide-react';

interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  scrollTo?: string;
}

interface WalkthroughProps {
  onComplete: () => void;
}

export default function Walkthrough({ onComplete }: WalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [contentVisible, setContentVisible] = useState(true);

  const scrollToTopSmooth = () => {
    // Try multiple strategies to ensure scrolling works
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
    try { document.documentElement.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
    try { document.body.scrollTop = 0; document.documentElement.scrollTop = 0; } catch (e) {}
  };

  const steps: WalkthroughStep[] = [
    {
      id: 'ai-staging',
      title: 'AI Image Staging',
      description: 'Click the magic wand to stage photos with AI furniture and enhancements. Click again to regenerate. Use toggle to compare.',
      targetSelector: '.staged-actions .stage-btn',
      position: 'left',
      scrollTo: '.main-image'
    },
    {
      id: 'ai-description',
      title: 'AI Description Generator',
      description: 'Generate compelling property descriptions instantly. Click the wand to create, click again to regenerate. Toggle between versions.',
      targetSelector: '.section-header-with-action .generate-description-btn',
      position: 'left',
      scrollTo: '.section-header-with-action'
    },
    {
      id: 'like-share',
      title: 'Save & Share',
      description: 'Like this listing or share it with others. Sign up to save your favorites!',
      targetSelector: '.listing-header .listing-actions', // Corrected selector
      position: 'bottom',
      scrollTo: '.listing-header'
    },
    {
      id: 'publish',
      title: 'Publish Your Listing',
      description: 'Ready to go live? Publish to Zillow, Apartments.com, and more platforms with one click!',
      targetSelector: '.publish-btn',
      position: 'top',
      scrollTo: '.publish-btn' // Ensure it scrolls right to the button
    }
  ];

  useEffect(() => {
    // Fade content between steps for smoother transitions
    setContentVisible(false);
    const id = setTimeout(() => setContentVisible(true), 50);
    return () => clearTimeout(id);
  }, [currentStep]);

  useEffect(() => {
    // Add/remove highlight class from the target element
    const allStepElements = steps.map(s => document.querySelector(s.targetSelector)).filter(Boolean);
    const currentElement = document.querySelector(steps[currentStep]?.targetSelector);

    allStepElements.forEach(el => {
      el?.classList.remove('walkthrough-highlight');
    });

    if (isVisible && currentElement) {
      currentElement.classList.add('walkthrough-highlight');
    }

    return () => {
      allStepElements.forEach(el => el?.classList.remove('walkthrough-highlight'));
    };
  }, [currentStep, isVisible, steps]);

  useEffect(() => {
    if (isVisible && currentStep < steps.length) {
      const step = steps[currentStep];
      
      const updatePosition = () => {
        const element = document.querySelector(step.targetSelector);
        if (element) {
          setTargetRect(element.getBoundingClientRect());
        }
      };

      // Scroll to element smoothly
      if (step.scrollTo) {
        const scrollElement = document.querySelector(step.scrollTo);
        if (scrollElement) {
          scrollElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      // Wait for scroll, then update position
      setTimeout(updatePosition, 600);

      // Update on scroll/resize
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [currentStep, isVisible, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Scroll back to top before closing (robust)
      scrollToTopSmooth();
      setTimeout(() => { handleClose(); }, 600);
    }
  };

  const handleSkip = () => {
    scrollToTopSmooth();
    setTimeout(() => { handleClose(); }, 400);
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenWalkthrough', 'true');
    onComplete();
  };

  if (!isVisible || !targetRect) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  // Calculate tooltip position - keep centered and away from edges
  const getTooltipStyle = () => {
    const edgeMargin = 20; // Distance from screen edges
    const tooltipWidth = 380;
    const tooltipHeight = 190;

    // Offset scales slightly with element size; always >=16 and <= 32
    const dynamicOffsetBase = Math.min(targetRect.width, targetRect.height) * 0.2;
    const offset = Math.max(16, Math.min(32, dynamicOffsetBase));

    let top = 0, left = 0;

    const targetCenterY = targetRect.top + targetRect.height / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;

    // Available space
    const spaceAbove = targetRect.top - edgeMargin;
    const spaceBelow = window.innerHeight - targetRect.bottom - edgeMargin;
    const spaceLeft = targetRect.left - edgeMargin;
    const spaceRight = window.innerWidth - targetRect.right - edgeMargin;

    // Choose the side dynamically if primary side lacks space
    let side = currentStepData.position;
    if (side === 'top' && spaceAbove < tooltipHeight + offset) side = 'bottom';
    else if (side === 'bottom' && spaceBelow < tooltipHeight + offset) side = 'top';
    else if (side === 'left' && spaceLeft < tooltipWidth + offset) side = 'right';
    else if (side === 'right' && spaceRight < tooltipWidth + offset) side = 'left';

    switch (side) {
      case 'bottom':
        left = targetCenterX - tooltipWidth / 2;
        top = targetRect.bottom + offset;
        break;
      case 'top':
        left = targetCenterX - tooltipWidth / 2;
        top = targetRect.top - tooltipHeight - offset;
        break;
      case 'left':
        left = targetRect.left - tooltipWidth - offset;
        top = targetCenterY - tooltipHeight / 2;
        break;
      case 'right':
        left = targetRect.right + offset;
        top = targetCenterY - tooltipHeight / 2;
        break;
    }

    // Clamp to viewport to prevent going off-screen
    left = Math.max(edgeMargin, Math.min(left, window.innerWidth - tooltipWidth - edgeMargin));
    top = Math.max(edgeMargin, Math.min(top, window.innerHeight - tooltipHeight - edgeMargin));

    // Ensure no overlap with the target (final guard)
    const overlapsVertically = !(top + tooltipHeight + offset <= targetRect.top || top >= targetRect.bottom + offset);
    const overlapsHorizontally = !(left + tooltipWidth + offset <= targetRect.left || left >= targetRect.right + offset);
    if (side === 'bottom' && overlapsVertically) {
      top = Math.min(window.innerHeight - tooltipHeight - edgeMargin, targetRect.bottom + offset);
    } else if (side === 'top' && overlapsVertically) {
      top = Math.max(edgeMargin, targetRect.top - tooltipHeight - offset);
    } else if (side === 'left' && overlapsHorizontally) {
      left = Math.max(edgeMargin, targetRect.left - tooltipWidth - offset);
    } else if (side === 'right' && overlapsHorizontally) {
      left = Math.min(window.innerWidth - tooltipWidth - edgeMargin, targetRect.right + offset);
    }

    return { top: `${top}px`, left: `${left}px` };
  };

  const tooltipStyle = getTooltipStyle();

  return (
    <>
      {/* Dark overlay */}
      <div className="walkthrough-overlay" onClick={handleSkip}></div>
      
      {/* Tooltip */}
      <div 
        className={`walkthrough-tooltip`}
        style={tooltipStyle}
      >
        <button onClick={handleSkip} className="walkthrough-close">
          <X size={20} />
        </button>
        <div className={`walkthrough-body ${contentVisible ? 'visible' : ''}`}>
          <div className="walkthrough-header">
            <div className="walkthrough-icon">
              <Wand2 size={24} />
            </div>
            <h4>{currentStepData.title}</h4>
          </div>
          <p className="walkthrough-description">{currentStepData.description}</p>
          <div className="walkthrough-footer">
            <div className="walkthrough-dots">
              {steps.map((_, index) => (
                <span key={index} className={index === currentStep ? 'active' : ''}></span>
              ))}
            </div>
            <div className="walkthrough-buttons">
              <button onClick={handleSkip} className="walkthrough-skip-btn">Skip</button>
              <button onClick={handleNext} className="walkthrough-next-btn">
                {isLastStep ? 'Done' : 'Next'} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .walkthrough-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 9998;
          animation: fadeIn 0.3s ease;
        }

        /* This is the new global class to highlight elements */
        :global(.walkthrough-highlight) {
          position: relative;
          z-index: 9999;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          animation: pulseGlow 1.5s infinite ease-in-out;
          border-radius: 12px; /* Default border radius */
          filter: blur(0) !important; /* Force un-blur */
        }
        
        /* Specific radius for round buttons */
        :global(.listing-header .listing-actions.walkthrough-highlight .action-btn) {
            border-radius: 50%;
            transform: scale(1.2);
        }

        @keyframes pulseGlow {
          0%, 100% {
            transform: scale(1.1);
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.7), 0 0 40px 10px rgba(59, 130, 246, 0.4);
          }
          50% {
            transform: scale(1.2);
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 1), 0 0 60px 20px rgba(59, 130, 246, 0.6);
          }
        }
        
        .walkthrough-tooltip {
          position: fixed; /* Use fixed positioning */
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
          padding: 24px;
          width: 380px;
          color: #e2e8f0;
          z-index: 10000;
          animation: popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-origin: center;
          transition: top 0.35s cubic-bezier(0.22, 1, 0.36, 1), left 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease;
          will-change: top, left, transform;
        }

        .walkthrough-body { opacity: 0; transition: opacity 0.25s ease; }
        .walkthrough-body.visible { opacity: 1; }
        
        @keyframes popIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .walkthrough-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .walkthrough-close:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #f1f5f9;
          transform: rotate(90deg);
        }
        
        .walkthrough-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 12px;
        }
        
        .walkthrough-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #1877F2 0%, #166FE5 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        
        .walkthrough-header h4 {
            color: #f8fafc;
            font-size: 1.25rem;
            font-weight: 600;
            margin: 0;
        }

        .walkthrough-description {
            font-size: 1rem;
            line-height: 1.6;
            color: #cbd5e1;
            margin: 0 0 24px 0;
        }
        
        .walkthrough-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .walkthrough-dots {
            display: flex;
            gap: 8px;
        }
        
        .walkthrough-dots span {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transition: all 0.3s ease;
        }
        
        .walkthrough-dots span.active {
            background: white;
            transform: scale(1.2);
        }
        
        .walkthrough-buttons {
            display: flex;
            gap: 12px;
        }
        
        .walkthrough-skip-btn {
            background: transparent;
            border: none;
            color: #94a3b8;
            font-size: 1rem;
            font-weight: 500;
            padding: 8px 12px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .walkthrough-skip-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }
        
        .walkthrough-next-btn {
            background: #1877F2;
            color: white;
            border: none;
            font-size: 1rem;
            font-weight: 600;
            padding: 10px 16px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
        }
        
        .walkthrough-next-btn:hover {
            background: #166FE5;
            box-shadow: 0 4px 20px rgba(24, 119, 242, 0.4);
            transform: translateY(-2px);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}

