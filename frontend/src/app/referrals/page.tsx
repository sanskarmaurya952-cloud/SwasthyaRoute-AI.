'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Referral, ReferralStatus } from '@/types';
import { RiskBadge } from '@/components/common/RiskBadge';
import { UrgencyPill } from '@/components/common/UrgencyPill';
import { SafetyBanner } from '@/components/common/SafetyBanner';
import {
  Send,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Filter,
  Search,
  RefreshCw,
  UserCheck,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

const STATUS_FILTERS: Array<string> = [
  'All',
  'Pending Review',
  'Approved',
  'In Transit',
  'Visit Completed',
  'Cancelled',
];

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Status update modal
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [newStatus, setNewStatus] = useState<ReferralStatus>('In Transit');
  const [updateNotes, setUpdateNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchReferrals = async () => {
    try {
      const data = await api.getReferrals();
      setReferrals(data);
    } catch (err) {
      console.error('Error fetching referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleOpenUpdateModal = (ref: Referral) => {
    setSelectedReferral(ref);
    setNewStatus(ref.status);
    setUpdateNotes('');
  };

  const handleUpdateStatusSubmit = async () => {
    if (!selectedReferral) return;
    setIsUpdating(true);

    try {
      await api.updateReferral(selectedReferral.id, {
        status: newStatus,
        notes: updateNotes ? `${selectedReferral.notes || ''} | Note: ${updateNotes}` : selectedReferral.notes,
      });
      setSelectedReferral(null);
      await fetchReferrals();
    } catch (err) {
      console.error('Error updating referral:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredReferrals = referrals.filter((r) => {
    const matchesFilter = filter === 'All' || r.status === filter;
    const matchesSearch =
      r.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.destination_facility_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#12304A]">Referral Management Center</h1>
            <span className="text-xs bg-[#EAF4F8] text-[#087F8C] font-semibold px-2 py-0.5 rounded border border-[#087F8C]/20">
              Active Routing
            </span>
          </div>
          <p className="text-xs text-[#536779] mt-0.5">
            Track patient transport, destination hospital handovers, and completed clinical visits
          </p>
        </div>

        <button
          onClick={() => {
            setLoading(true);
            fetchReferrals();
          }}
          className="p-2 text-slate-500 hover:text-[#12304A] hover:bg-slate-100 rounded-lg border border-slate-200 transition flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#087F8C]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <SafetyBanner compact />

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filter === s
                    ? 'bg-[#12304A] text-white'
                    : 'bg-slate-100 text-[#536779] hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search patient, hospital, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F8C]"
            />
          </div>
        </div>
      </div>

      {/* Referral Cards / Table */}
      <div className="space-y-3">
        {filteredReferrals.length > 0 ? (
          filteredReferrals.map((ref) => {
            const isEmergency = ref.risk_category === 'HIGH';

            let statusBg = 'bg-slate-100 text-slate-800 border-slate-300';
            if (ref.status === 'Approved') statusBg = 'bg-sky-50 text-sky-800 border-sky-300 font-semibold';
            if (ref.status === 'In Transit') statusBg = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
            if (ref.status === 'Visit Completed') statusBg = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
            if (ref.status === 'Cancelled') statusBg = 'bg-red-50 text-red-700 border-red-200';

            return (
              <div
                key={ref.id}
                className={`bg-white rounded-xl border p-5 shadow-xs transition hover:border-[#087F8C]/60 ${
                  isEmergency ? 'border-red-200 bg-red-50/10' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left Patient & Facility Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#536779] bg-slate-100 px-2 py-0.5 rounded">
                        {ref.id}
                      </span>
                      <h3 className="font-bold text-sm text-[#12304A]">
                        {ref.patient_name}
                      </h3>
                      <span className="text-xs text-[#536779]">
                        ({ref.patient_age} yrs, {ref.patient_village})
                      </span>
                      <RiskBadge risk={ref.risk_category} size="sm" />
                      <UrgencyPill urgency={ref.urgency} size="sm" />
                    </div>

                    <div className="text-xs text-[#12304A] font-medium">
                      <strong>Reason:</strong> {ref.reason}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#536779] pt-1">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#087F8C]" />
                        <span>
                          Destination: <strong className="text-[#12304A]">{ref.destination_facility_name}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          Transport: <strong className="text-[#12304A]">{ref.transport_mode || 'Standard'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Timeline History */}
                    {ref.status_history && ref.status_history.length > 0 && (
                      <div className="pt-2 flex items-center gap-1.5 flex-wrap text-[11px] text-[#536779]">
                        <span className="font-semibold text-slate-600">Audit Trail:</span>
                        {ref.status_history.map((step, idx) => (
                          <React.Fragment key={idx}>
                            <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                              {step.status} ({new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                            </span>
                            {idx < ref.status_history.length - 1 && <span>→</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Status & Action */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-3 border-t lg:border-t-0 pt-3 lg:pt-0">
                    <div className={`px-3 py-1 rounded-full text-xs border ${statusBg}`}>
                      {ref.status}
                    </div>

                    <button
                      onClick={() => handleOpenUpdateModal(ref)}
                      className="px-3.5 py-1.5 bg-[#087F8C] hover:bg-[#066670] text-white text-xs font-semibold rounded-lg transition shadow-xs flex items-center gap-1"
                    >
                      <span>Update Status</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-[#536779]">
            No referrals found matching the selected filter.
          </div>
        )}
      </div>

      {/* UPDATE STATUS MODAL */}
      {selectedReferral && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#12304A]">
                Update Referral Status ({selectedReferral.id})
              </h3>
              <button
                onClick={() => setSelectedReferral(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="font-bold text-[#12304A]">{selectedReferral.patient_name}</div>
                <div className="text-[#536779]">
                  Destination: {selectedReferral.destination_facility_name}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#12304A] mb-1">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ReferralStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Pending Review">Pending Review</option>
                  <option value="Approved">Approved (ASHA Worker Verified)</option>
                  <option value="In Transit">In Transit (Ambulance / En Route)</option>
                  <option value="Visit Completed">Visit Completed (Doctor Consulted)</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#12304A] mb-1">
                  Handover / Outcome Note
                </label>
                <textarea
                  rows={3}
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="e.g. Patient reached CHC Rampur. Medical Officer Dr. Verma initiated nebulization."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#087F8C]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReferral(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleUpdateStatusSubmit}
                className="px-5 py-2 text-xs font-bold text-white bg-[#087F8C] hover:bg-[#066670] rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Status Update</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
