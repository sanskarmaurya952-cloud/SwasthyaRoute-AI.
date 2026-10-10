import React from 'react';
import { RiskCategory } from '@/types';
import { AlertTriangle, CheckCircle, ShieldAlert, HelpCircle } from 'lucide-react';

interface Props {
  risk: RiskCategory | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<Props> = ({ risk, size = 'md', showIcon = true }) => {
  const normalized = (risk || 'LOW').toUpperCase();

  let bg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  let Icon = CheckCircle;
  let label = 'Low Risk';

  if (normalized === 'HIGH' || normalized === 'CRITICAL') {
    bg = 'bg-red-50 text-red-700 border-red-300 font-bold';
    Icon = ShieldAlert;
    label = 'High Risk';
  } else if (normalized === 'MODERATE' || normalized === 'MEDIUM') {
    bg = 'bg-amber-50 text-amber-800 border-amber-300';
    Icon = AlertTriangle;
    label = 'Moderate Risk';
  } else if (normalized === 'UNKNOWN') {
    bg = 'bg-slate-100 text-slate-700 border-slate-300';
    Icon = HelpCircle;
    label = 'Unknown / Needs Review';
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm gap-2 font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${bg} ${sizeClasses} shadow-xs`}
    >
      {showIcon && <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{label}</span>
    </span>
  );
};
