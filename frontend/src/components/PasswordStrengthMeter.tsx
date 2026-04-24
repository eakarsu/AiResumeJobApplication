import React from 'react';
import { Check, X } from 'lucide-react';

interface Props {
  password: string;
}

const requirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const PasswordStrengthMeter: React.FC<Props> = ({ password }) => {
  if (!password) return null;

  const score = requirements.filter((r) => r.test(password)).length;

  const getColor = () => {
    if (score <= 1) return 'bg-red-500';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-green-400';
    return 'bg-green-600';
  };

  const getLabel = () => {
    if (score <= 1) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Strong';
    return 'Very Strong';
  };

  return (
    <div className="mt-2 space-y-2">
      {/* Progress bar */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getColor()}`}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-500">{getLabel()}</span>
      </div>

      {/* Checklist */}
      <ul className="space-y-1">
        {requirements.map((req) => {
          const met = req.test(password);
          return (
            <li key={req.label} className="flex items-center space-x-2 text-xs">
              {met ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <X className="w-3 h-3 text-gray-300" />
              )}
              <span className={met ? 'text-green-700' : 'text-gray-400'}>{req.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordStrengthMeter;
