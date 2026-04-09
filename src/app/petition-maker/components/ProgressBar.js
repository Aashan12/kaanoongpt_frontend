'use client';

import { Check } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Case Type' },
  { id: 2, label: 'Court Info' },
  { id: 3, label: 'Parties' },
  { id: 4, label: 'Case Details' },
  { id: 5, label: 'Witnesses' },
  { id: 6, label: 'Review' },
];

export default function ProgressBar({ currentStep, totalSteps = 6 }) {
  return (
    <div className="progress-bar">
      <div className="progress-steps">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.id} className="progress-step-wrapper">
              <div className="progress-step-item">
                <div
                  className={`progress-step-circle ${
                    isCompleted ? 'completed' : ''
                  } ${isCurrent ? 'current' : ''}`}
                >
                  {isCompleted ? (
                    <Check size={16} />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                <span className="progress-step-label">{step.label}</span>
              </div>
              {!isLast && (
                <div
                  className={`progress-step-line ${
                    isCompleted ? 'completed' : ''
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
