'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  Send,
  CalendarCheck,
  Building2,
  Settings,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Assess Patient', href: '/assess', icon: Stethoscope, highlight: true },
  { label: 'Patient Records', href: '/patients', icon: Users },
  { label: 'Referral Center', href: '/referrals', icon: Send },
  { label: 'Follow-ups', href: '/followups', icon: CalendarCheck },
  { label: 'Facilities', href: '/facilities', icon: Building2 },
  { label: 'Settings & Offline', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#12304A] text-white flex flex-col shrink-0 min-h-[calc(100vh-57px)] border-r border-[#0D2235]">
      {/* Quick Demo Scenario Callout */}
      <div className="p-3 m-3 bg-[#1D4363] rounded-lg border border-[#087F8C]/40">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F2B544] mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Hackathon Demo Case</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-tight mb-2.5">
          Patient: 58 yrs • Breathlessness + Fever • SpO₂: 89%
        </p>
        <Link
          href="/assess?demo=true"
          className="block w-full text-center py-1.5 px-2 bg-[#087F8C] hover:bg-[#0AA5B5] text-white font-medium text-xs rounded transition shadow-xs"
        >
          Load 90s Demo Flow →
        </Link>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 space-y-1 py-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#087F8C] text-white shadow-xs font-semibold'
                  : 'text-slate-300 hover:bg-[#1D4363] hover:text-white'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? 'text-white' : item.highlight ? 'text-[#087F8C]' : 'text-slate-400'
                }`}
              />
              <span>{item.label}</span>
              {item.highlight && !isActive && (
                <span className="ml-auto text-[10px] bg-[#087F8C]/40 text-teal-200 px-1.5 py-0.2 rounded font-semibold">
                  New
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Safety Compliance & Offline Notice */}
      <div className="p-3 m-3 bg-[#0D2235] rounded-lg border border-slate-700/50 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#087F8C]" />
          <span>Decision Support CDS</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-normal">
          Transparent clinical red-flag rules. Non-diagnostic. Designed for rural frontline health workers.
        </p>
      </div>
    </aside>
  );
};
