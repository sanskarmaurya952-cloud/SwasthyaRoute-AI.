import React from 'react';
import { UrgencyLevel } from '@/types';
import { Siren, Clock, CalendarCheck, Home } from 'lucide-react';

interface Props {
  urgency: UrgencyLevel | string;
  size?: 'sm' | 'md' | 'lg';
}

export const UrgencyPill: React.FC<Props> = ({ urgency, size = 'md' }) => {
  const norm = urgency || 'ROUTINE_SCHEDULED';

  let config = {
    label: 'Routine (Scheduled)',
    bg: 'bg-sky-50 text-sky-800 border-sky-200',
    icon: CalendarCheck,
  };

  if (norm === 'EMERGENCY_IMMEDIATE') {
    config = {
      label: 'Emergency (Immediate)',
      bg: 'bg-red-100 text-red-800 border-red-300 font-bold',
      icon: Siren,
    };
  } else if (norm === 'URGENT_SAME_DAY') {
    config = {
      label: 'Urgent (Same-Day)',
      bg: 'bg-amber-100 text-amber-900 border-amber-300 font-medium',
      icon: Clock,
    };
  } else if (norm === 'HOME_CARE_MONITORING') {
    config = {
      label: 'Home Care / Monitoring',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: Home,
    };
  }

  const sizeCls = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  }[size];

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center rounded-md border ${config.bg} ${sizeCls}`}>
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};
