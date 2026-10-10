'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { DashboardStats } from '@/types';
import { RiskBadge } from '@/components/common/RiskBadge';
import { UrgencyPill } from '@/components/common/UrgencyPill';
import { SafetyBanner } from '@/components/common/SafetyBanner';
import {
  Users,
  ShieldAlert,
  Send,
  CalendarCheck,
  AlertOctagon,
  Stethoscope,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  PhoneCall,
  Activity,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleMarkFollowupDone = async (id: string) => {
    await api.updateFollowup(id, { status: 'Completed', notes: 'Completed from quick dashboard checklist.' });
    fetchStats();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Greeting & Quick CTAs */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-[#12304A]">
              Good morning, ASHA Worker
            </h1>
            <span className="text-xs bg-[#EAF4F8] text-[#087F8C] font-semibold px-2 py-0.5 rounded border border-[#087F8C]/20">
              Demo Mode
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#536779]">
            Sector 4 Rampur • Frontline Triage & Smart Referral Assistant
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto">
          <Link
            href="/assess?demo=true"
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs rounded-lg transition shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Load Demo Scenario (90s)</span>
          </Link>

          <Link
            href="/assess"
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-[#087F8C] hover:bg-[#066670] text-white font-semibold text-xs rounded-lg transition shadow-xs"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Assess New Patient</span>
          </Link>

          <button
            onClick={handleManualRefresh}
            title="Refresh dashboard stats"
            className="p-2 text-slate-500 hover:text-[#12304A] hover:bg-slate-100 rounded-lg border border-slate-200 transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#087F8C]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mandatory Clinical Safety Banner */}
      <SafetyBanner />

      {/* Metrics Row (Derived dynamically from data) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Assessed Today */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[#536779] mb-2">
            <span className="text-xs font-medium">Assessed Today</span>
            <div className="p-1.5 bg-[#EAF4F8] text-[#087F8C] rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#12304A]">
            {loading ? '...' : stats?.patients_assessed_today ?? 0}
          </div>
          <span className="text-[11px] text-[#536779] mt-0.5 block">Live tally</span>
        </div>

        {/* High-Risk Critical */}
        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs bg-gradient-to-br from-white to-red-50/40">
          <div className="flex items-center justify-between text-red-700 mb-2">
            <span className="text-xs font-medium font-semibold">High-Risk Cases</span>
            <div className="p-1.5 bg-red-100 text-red-700 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-700">
            {loading ? '...' : stats?.high_risk_assessments ?? 0}
          </div>
          <span className="text-[11px] text-red-600/90 mt-0.5 block font-medium">Requires immediate care</span>
        </div>

        {/* Referrals Pending */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[#536779] mb-2">
            <span className="text-xs font-medium">Referrals Active</span>
            <div className="p-1.5 bg-sky-50 text-sky-700 rounded-lg">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#12304A]">
            {loading ? '...' : stats?.referrals_pending ?? 0}
          </div>
          <span className="text-[11px] text-[#536779] mt-0.5 block">In transit or review</span>
        </div>

        {/* Follow-ups Due */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-[#536779] mb-2">
            <span className="text-xs font-medium">Follow-ups Due</span>
            <div className="p-1.5 bg-amber-50 text-amber-800 rounded-lg">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#12304A]">
            {loading ? '...' : stats?.followups_due ?? 0}
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-0.5 block">Scheduled today</span>
        </div>

        {/* Missed Follow-ups */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[#536779] mb-2">
            <span className="text-xs font-medium">Missed Follow-ups</span>
            <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#536779]">
            {loading ? '...' : stats?.missed_followups ?? 0}
          </div>
          <span className="text-[11px] text-[#536779] mt-0.5 block">Needs re-contact</span>
        </div>
      </div>

      {/* Middle Section: Urgency Distribution + Offline Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgency Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#12304A]">Clinical Urgency Distribution</h2>
              <p className="text-xs text-[#536779]">Categorization of assessed patients by triage urgency</p>
            </div>
            <span className="text-xs text-[#536779] font-medium bg-slate-100 px-2 py-0.5 rounded">
              Rule-Engine Output
            </span>
          </div>

          <div className="space-y-3">
            {/* Emergency Immediate */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-red-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                  Emergency Immediate (DH / CHC)
                </span>
                <span className="font-bold text-red-700">
                  {stats?.urgency_distribution?.EMERGENCY_IMMEDIATE ?? 0} cases
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-red-600 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      ((stats?.urgency_distribution?.EMERGENCY_IMMEDIATE ?? 0) /
                        Math.max(1, (stats?.patients_assessed_today || 1) + 2)) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Urgent Same Day */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-amber-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Urgent Same-Day (CHC / PHC)
                </span>
                <span className="font-bold text-amber-800">
                  {stats?.urgency_distribution?.URGENT_SAME_DAY ?? 0} cases
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      ((stats?.urgency_distribution?.URGENT_SAME_DAY ?? 0) /
                        Math.max(1, (stats?.patients_assessed_today || 1) + 2)) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Routine Scheduled */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-sky-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  Routine Scheduled (PHC / Sub-centre)
                </span>
                <span className="font-bold text-sky-800">
                  {stats?.urgency_distribution?.ROUTINE_SCHEDULED ?? 0} cases
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-sky-500 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      ((stats?.urgency_distribution?.ROUTINE_SCHEDULED ?? 0) /
                        Math.max(1, (stats?.patients_assessed_today || 1) + 2)) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Home Care */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Home Care / Monitoring
                </span>
                <span className="font-bold text-emerald-800">
                  {stats?.urgency_distribution?.HOME_CARE_MONITORING ?? 0} cases
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      ((stats?.urgency_distribution?.HOME_CARE_MONITORING ?? 0) /
                        Math.max(1, (stats?.patients_assessed_today || 1) + 2)) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Sync & Frontline Architecture Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#536779]">
                Frontline Reliability
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            </div>
            <h3 className="text-sm font-bold text-[#12304A] mb-1">
              Offline-First Architecture
            </h3>
            <p className="text-xs text-[#536779] leading-relaxed mb-3">
              All triage rules and patient drafts operate 100% locally via browser IndexedDB. Assessments are stored and queued even when internet is unavailable.
            </p>
            <div className="bg-[#EAF4F8] p-2.5 rounded-lg text-xs space-y-1 text-[#12304A]">
              <div className="flex justify-between">
                <span className="text-[#536779]">State:</span>
                <span className="font-semibold">{stats?.sync_status || 'Online'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#536779]">Local Storage:</span>
                <span className="font-semibold text-[#087F8C]">IndexedDB Active</span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100">
            <Link
              href="/settings"
              className="text-xs text-[#087F8C] hover:text-[#066670] font-semibold flex items-center justify-between"
            >
              <span>Manage Offline Mode & Sync Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Assessments & Pending Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Assessments List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#12304A]">Recent Patient Assessments</h2>
              <p className="text-xs text-[#536779]">Latest clinical triage logs recorded by ASHA worker</p>
            </div>
            <Link
              href="/patients"
              className="text-xs font-semibold text-[#087F8C] hover:underline flex items-center gap-1"
            >
              <span>View All Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats?.recent_assessments && stats.recent_assessments.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.recent_assessments.map((assess) => (
                <div key={assess.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 hover:bg-slate-50/80 -mx-2 px-2 rounded-md transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#12304A]">
                        {assess.patient_name}
                      </span>
                      <span className="text-xs text-[#536779]">
                        ({assess.patient_age} yrs, {assess.patient_village})
                      </span>
                      {assess.is_demo_case && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                          DEMO CASE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center flex-wrap gap-2 text-xs text-[#536779]">
                      <span>Symptoms: {assess.symptoms?.join(', ')}</span>
                      {assess.vitals?.spo2 && (
                        <span className={`font-semibold ${Number(assess.vitals.spo2) < 90 ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                          • SpO₂: {assess.vitals.spo2}%
                        </span>
                      )}
                      {assess.vitals?.temperature && (
                        <span>• Temp: {assess.vitals.temperature}°F</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <RiskBadge risk={assess.risk_category} size="sm" />
                    <UrgencyPill urgency={assess.urgency} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-[#536779]">
              No assessments recorded yet. Click &ldquo;Assess New Patient&rdquo; to begin.
            </div>
          )}
        </div>

        {/* Pending Follow-ups Action List */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#12304A]">Pending Follow-ups</h2>
              <p className="text-xs text-[#536779]">ASHA home visits & checkups</p>
            </div>
            <Link
              href="/followups"
              className="text-xs font-semibold text-[#087F8C] hover:underline"
            >
              View All
            </Link>
          </div>

          {stats?.pending_followups_list && stats.pending_followups_list.length > 0 ? (
            <div className="space-y-2.5">
              {stats.pending_followups_list.map((fol) => (
                <div
                  key={fol.id}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#12304A]">{fol.patient_name}</span>
                    <span className="text-[11px] text-amber-800 bg-amber-100 font-medium px-1.5 py-0.5 rounded">
                      Due: {fol.due_date}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#536779] line-clamp-2">
                    {fol.follow_up_reason}
                  </p>
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-[#536779]">{fol.patient_village}</span>
                    <button
                      onClick={() => handleMarkFollowupDone(fol.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#087F8C] hover:text-[#066670] bg-white px-2 py-0.5 rounded border border-slate-200 hover:border-[#087F8C]"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Mark Done</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-[#536779]">
              No pending follow-ups for today.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
