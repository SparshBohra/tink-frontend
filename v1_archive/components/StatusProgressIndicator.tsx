import React from 'react';
import { Application, ApplicationStatus, APPLICATION_STATUSES, getStatusIcon, getStatusDisplayName } from '../lib/types';

interface StatusProgressIndicatorProps {
  application: Application;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const WORKFLOW_STEPS = [
  { status: APPLICATION_STATUSES.PENDING, label: 'Review', shortLabel: 'Review' },
  { status: APPLICATION_STATUSES.APPROVED, label: 'Approved', shortLabel: 'Approved' },
  { status: APPLICATION_STATUSES.VIEWING_SCHEDULED, label: 'Viewing Scheduled', shortLabel: 'Viewing' },
  { status: APPLICATION_STATUSES.VIEWING_COMPLETED, label: 'Viewing Complete', shortLabel: 'Viewed' },
  { status: APPLICATION_STATUSES.ROOM_ASSIGNED, label: 'Room Assigned', shortLabel: 'Room' },
  { status: APPLICATION_STATUSES.LEASE_CREATED, label: 'Lease Generated', shortLabel: 'Lease' },
  { status: APPLICATION_STATUSES.LEASE_SIGNED, label: 'Lease Signed', shortLabel: 'Signed' },
  { status: APPLICATION_STATUSES.MOVED_IN, label: 'Moved In', shortLabel: 'Moved' },
];

export default function StatusProgressIndicator({ 
  application, 
  showLabels = true, 
  size = 'md' 
}: StatusProgressIndicatorProps) {
  const getCurrentStepIndex = (status: ApplicationStatus): number => {
    // Handle rejected status
    if (status === APPLICATION_STATUSES.REJECTED) {
      return -1;
    }
    
    // Handle legacy statuses
    if (status === APPLICATION_STATUSES.PROCESSING) {
      return 2; // Map to viewing stage
    }
    if (status === APPLICATION_STATUSES.ACTIVE) {
      return 7; // Map to moved in
    }
    
    const stepIndex = WORKFLOW_STEPS.findIndex(step => step.status === status);
    return stepIndex;
  };

  const currentStepIndex = getCurrentStepIndex(application.status);
  const isRejected = application.status === APPLICATION_STATUSES.REJECTED;

  const getStepStatus = (stepIndex: number) => {
    if (isRejected) return 'rejected';
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  const getStepColor = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed': return 'bg-green-500 text-white';
      case 'current': return 'bg-blue-500 text-white';
      case 'rejected': return 'bg-red-500 text-white';
      default: return 'bg-gray-200 text-gray-500';
    }
  };

  const getConnectorColor = (stepIndex: number) => {
    if (isRejected) return 'bg-red-300';
    if (stepIndex < currentStepIndex) return 'bg-green-300';
    return 'bg-gray-300';
  };

  const sizeClasses = {
    sm: {
      circle: 'w-6 h-6 text-xs',
      text: 'text-xs',
      connector: 'h-0.5',
    },
    md: {
      circle: 'w-8 h-8 text-sm',
      text: 'text-sm',
      connector: 'h-1',
    },
    lg: {
      circle: 'w-10 h-10 text-base',
      text: 'text-base',
      connector: 'h-1',
    },
  };

  const classes = sizeClasses[size];

  if (isRejected) {
    return (
      <div className="flex items-center space-x-2">
        <div className={`${classes.circle} rounded-full bg-red-500 text-white flex items-center justify-center font-medium`}>
          ❌
        </div>
        <span className={`${classes.text} font-medium text-red-600`}>
          Application Rejected
        </span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {WORKFLOW_STEPS.map((step, index) => {
          const stepStatus = getStepStatus(index);
          const isLast = index === WORKFLOW_STEPS.length - 1;
          
          return (
            <div key={step.status} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div 
                  className={`${classes.circle} rounded-full flex items-center justify-center font-medium ${getStepColor(stepStatus)}`}
                  title={getStatusDisplayName(step.status)}
                >
                  {stepStatus === 'completed' ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : stepStatus === 'current' ? (
                    getStatusIcon(step.status)
                  ) : (
                    index + 1
                  )}
                </div>
                {showLabels && (
                  <span className={`${classes.text} mt-1 text-center font-medium ${
                    stepStatus === 'current' ? 'text-blue-600' : 
                    stepStatus === 'completed' ? 'text-green-600' : 
                    'text-gray-500'
                  }`}>
                    {size === 'sm' ? step.shortLabel : step.label}
                  </span>
                )}
              </div>
              {!isLast && (
                <div className={`flex-1 ${classes.connector} ${getConnectorColor(index)} mx-2`}></div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Current status description */}
      <div className="mt-3 text-center">
        <span className={`${classes.text} text-gray-600`}>
          Current Status: <span className="font-medium">{getStatusDisplayName(application.status)}</span>
        </span>
      </div>
    </div>
  );
} 