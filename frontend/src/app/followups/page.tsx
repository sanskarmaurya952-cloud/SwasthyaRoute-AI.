'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { FollowUp, FollowUpStatus } from '@/types';
import { SafetyBanner } from '@/components/common/SafetyBanner';
import {
  CalendarCheck,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Plus,
  RefreshCw,
  Search,
  MapPin,
  FileText,
  Calendar,
} from 'lucide-react';

export default function FollowupsPage() {
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Due' | 'Completed' | 'Missed'>('All');
  const [search, setSearch] = useState('');

  // Complete / Update Modal
  const [selectedFollowup, setSelectedFollowup] = useState<FollowUp | null>(null);
  const [actionType, setActionType] = useState<'complete' | 'reschedule'>('complete');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchFollowups = async () => {
    try {
      const data = await api.getFollowups();
      setFollowups(data);
    } catch (err) {
      console.error('Error loading followups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, []);

  const handleOpenAction = (fol: FollowUp, type: 'complete' | 'reschedule') => {
    setSelectedFollowup(fol);
    setActionType(type);
    setResolutionNotes(fol.notes || '');
    setNewDueDate(fol.due_date);
  };

  const handleSaveAction = async () => {
    if (!selectedFollowup) return;
    setIsUpdating(true);

    try {
      if (actionType === 'complete') {
        await api.updateFollowup(selectedFollowup.id, {
          status: 'Completed',
          notes: resolutionNotes ? `${selectedFollowup.notes || ''} | Complete note: ${resolutionNotes}` : (selectedFollowup.notes || undefined),
        });
      } else {
        await api.updateFollowup(selectedFollowup.id, {
          status: 'Due',
          due_date: newDueDate,
          notes: resolutionNotes ? `${selectedFollowup.notes || ''} | Rescheduled to ${newDueDate}: ${resolutionNotes}` : (selectedFollowup.notes || undefined),
        });
      }
      setSelectedFollowup(null);
      await fetchFollowups();
    } catch (err) {
      console.error('Error updating follow-up:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const filtered = followups.filter((f) => {
    const matchesFilter = filter === 'All' || f.status === filter;
    const matchesSearch =
      f.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      f.follow_up_reason.toLowerCase().includes(search.toLowerCase()) ||
      f.patient_village.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#12304A]">ASHA Follow-up Tracking</h1>
            <span className="text-xs bg-[#EAF4F8] text-[#087F8C] font-semibold px-2 py-0.5 rounded border border-[#087F8C]/20">
              Post-Triage Continuity
            </span>
          </div>
          <p className="text-xs text-[#536779] mt-0.5">
            Ensure post-referral recovery, medication adherence, and home visits in the village
          </p>
        </div>

        <button
          onClick={() => {
            setLoading(true);
            fetchFollowups();
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
          <div className="flex items-center gap-1.5">
            {(['All', 'Due', 'Completed', 'Missed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filter === s
                    ? 'bg-[#12304A] text-white'
                    : 'bg-slate-100 text-[#536779] hover:bg-slate-200'
                }`}
              >
                {s} ({followups.filter((f) => s === 'All' || f.status === s).length})
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by patient or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F8C]"
            />
          </div>
        </div>
      </div>

      {/* Follow-up Cards */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((fol) => {
            const isDue = fol.status === 'Due';
            const isCompleted = fol.status === 'Completed';
            const isMissed = fol.status === 'Missed';

            return (
              <div
                key={fol.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition hover:border-[#087F8C]/60"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#536779] bg-slate-100 px-2 py-0.5 rounded">
                        {fol.id}
                      </span>
                      <h3 className="font-bold text-sm text-[#12304A]">
                        {fol.patient_name}
                      </h3>
                      <span className="text-xs text-[#536779] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#087F8C]" />
                        {fol.patient_village}
                      </span>
                      {fol.referral_id && (
                        <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-1.5 py-0.2 rounded">
                          Linked: {fol.referral_id}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#12304A] font-medium">
                      <strong>Reason:</strong> {fol.follow_up_reason}
                    </p>

                    {fol.notes && (
                      <p className="text-[11px] text-[#536779] bg-slate-50 p-2 rounded border border-slate-100">
                        {fol.notes}
                      </p>
                    )}

                    <div className="text-[11px] text-[#536779] flex items-center gap-3 pt-1">
                      <span>Scheduled Due Date: <strong className="text-[#12304A]">{fol.due_date}</strong></span>
                      {fol.completed_at && (
                        <span>Completed: <strong>{new Date(fol.completed_at).toLocaleDateString()}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2.5 border-t sm:border-t-0 pt-3 sm:pt-0">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : isMissed
                          ? 'bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {fol.status}
                    </span>

                    {isDue && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenAction(fol, 'reschedule')}
                          className="px-2.5 py-1 text-slate-600 hover:text-[#12304A] hover:bg-slate-100 text-xs font-semibold rounded border border-slate-200"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleOpenAction(fol, 'complete')}
                          className="px-3 py-1 bg-[#087F8C] hover:bg-[#066670] text-white text-xs font-bold rounded flex items-center gap-1 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Done</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-[#536779]">
            No follow-ups found for this view.
          </div>
        )}
      </div>

      {/* RESOLUTION / RESCHEDULE MODAL */}
      {selectedFollowup && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#12304A]">
                {actionType === 'complete' ? 'Complete Follow-up Visit' : 'Reschedule Follow-up Visit'}
              </h3>
              <button
                onClick={() => setSelectedFollowup(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="font-bold text-[#12304A]">{selectedFollowup.patient_name}</div>
                <div className="text-[#536779]">{selectedFollowup.follow_up_reason}</div>
              </div>

              {actionType === 'reschedule' && (
                <div>
                  <label className="block font-semibold text-[#12304A] mb-1">
                    New Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#12304A] mb-1">
                  Visit Notes & Patient Outcome
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Visited patient at home. SpO2 measured 97% on room air. Taking antibiotics as prescribed."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#087F8C]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedFollowup(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSaveAction}
                className="px-5 py-2 text-xs font-bold text-white bg-[#087F8C] hover:bg-[#066670] rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
