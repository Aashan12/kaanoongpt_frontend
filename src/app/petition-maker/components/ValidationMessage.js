'use client';

import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function ValidationMessage({ type = 'error', message, field }) {
  if (!message) return null;

  const icons = {
    error: AlertCircle,
    success: CheckCircle,
    info: Info,
  };

  const Icon = icons[type] || AlertCircle;

  return (
    <div className={`validation-message validation-${type}`}>
      <Icon size={16} />
      <span>{message}</span>
    </div>
  );
}

export function ValidationSummary({ errors }) {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="validation-summary">
      <div className="validation-summary-header">
        <AlertCircle size={20} />
        <h4>Please fix the following errors:</h4>
      </div>
      <ul className="validation-summary-list">
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </div>
  );
}
