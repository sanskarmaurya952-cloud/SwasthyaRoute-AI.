'use client';

import React, { useState, useEffect } from 'react';
import { offlineDB } from '@/lib/offline-db';
import { api } from '@/lib/api-client';
import { SyncQueueItem } from '@/types';
import { SafetyBanner } from '@/components/common/SafetyBanner';
import {
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  Download,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Server,
  HardDrive,
  Info,
} from 'lucide-react';

export default function SettingsPage() {
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [storageStats, setStorageStats] = useState({
    patients: 0,
    assessments: 0,
    referrals: 0,
    followups: 0,
    facilities: 0,
  });
  const [isResetting, setIsResetting] = useState(false);

  const loadData = async () => {
    setIsSimulatedOffline(offlineDB.getSimulatedOffline());
    try {
      const queue = await offlineDB.getSyncQueue();
      setSyncQueue(queue);

      const [pts, asts, refs, fols, facs] = await Promise.all([
        offlineDB.getAll('patients'),
        offlineDB.getAll('assessments'),
        offlineDB.getAll('referrals'),
        offlineDB.getAll('followups'),
        offlineDB.getAll('facilities'),
      ]);

      setStorageStats({
        patients: pts.length,
        assessments: asts.length,
        referrals: refs.length,
        followups: fols.length,
        facilities: facs.length,
      });
    } catch (err) {
      console.error('Error loading settings storage data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleOffline = () => {
    const nextVal = !isSimulatedOffline;
    setIsSimulatedOffline(nextVal);
    offlineDB.setSimulatedOffline(nextVal);
    setSyncMessage({
      text: nextVal
        ? '📴 Simulated Offline Mode Enabled. Network requests will now route strictly through browser IndexedDB.'
        : '🌐 Online Mode Restored. Ready for server sync.',
      success: true,
    });
    setTimeout(() => setSyncMessage(null), 4000);
  };

  const handleTriggerSync = async () => {
    if (isSimulatedOffline) {
      setSyncMessage({
        text: 'Cannot sync while Simulated Offline Mode is active. Switch to Online mode first.',
        success: false,
      });
      setTimeout(() => setSyncMessage(null), 4000);
      return;
    }

    setIsSyncing(true);
    const res = await api.syncPendingWithBackend();
    setIsSyncing(false);

    setSyncMessage({
      text: res.message,
      success: res.success,
    });
    loadData();
    setTimeout(() => setSyncMessage(null), 5000);
  };

  const handleResetData = async () => {
    if (confirm('Are you sure you want to reset all data back to the clean demonstration baseline?')) {
      setIsResetting(true);
      await api.resetDemoData();
      await loadData();
      setIsResetting(false);
      setSyncMessage({
        text: 'Clean demo state restored successfully.',
        success: true,
      });
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const handleExportJSON = async () => {
    try {
      const [pts, asts, refs, fols] = await Promise.all([
        offlineDB.getAll('patients'),
        offlineDB.getAll('assessments'),
        offlineDB.getAll('referrals'),
        offlineDB.getAll('followups'),
      ]);

      const dump = {
        app: 'SwasthyaRoute AI',
        version: '1.0.0-hackathon',
        exported_at: new Date().toISOString(),
        data: {
          patients: pts,
          assessments: asts,
          referrals: refs,
          followups: fols,
        },
      };

      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `swasthya_route_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#12304A]">Offline Engine & System Settings</h1>
            <span className="text-xs bg-[#EAF4F8] text-[#087F8C] font-semibold px-2 py-0.5 rounded border border-[#087F8C]/20">
              Diagnostic Controls
            </span>
          </div>
          <p className="text-xs text-[#536779] mt-0.5">
            Offline simulation, IndexedDB storage inspection, synchronization queues, and demo resets
          </p>
        </div>
      </div>

      <SafetyBanner compact />

      {syncMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            syncMessage.success
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-red-50 text-red-800 border-red-300'
          }`}
        >
          {syncMessage.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{syncMessage.text}</span>
        </div>
      )}

      {/* Offline Simulation Control Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#12304A] flex items-center gap-2">
              {isSimulatedOffline ? (
                <WifiOff className="w-5 h-5 text-amber-600" />
              ) : (
                <Wifi className="w-5 h-5 text-emerald-600" />
              )}
              <span>Hackathon Judge: Offline Simulation Mode</span>
            </h2>
            <p className="text-xs text-[#536779] mt-1 max-w-2xl leading-relaxed">
              Toggle simulated offline operation to verify that patient assessments, Hindi speech transcription fallback, clinical triage rules, and referral creation operate 100% locally using IndexedDB without requiring active network connectivity.
            </p>
          </div>

          <button
            onClick={handleToggleOffline}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs border transition flex items-center gap-2 shadow-xs shrink-0 ${
              isSimulatedOffline
                ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
            }`}
          >
            <span>{isSimulatedOffline ? 'SIMULATING OFFLINE (ON)' : 'SIMULATE OFFLINE (OFF)'}</span>
          </button>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[#536779]">Current Frontend Status:</span>
            <strong className="text-[#12304A]">
              {isSimulatedOffline ? 'Simulated Offline (IndexedDB Local Engine)' : 'Online (FastAPI Backend + Local Mirror)'}
            </strong>
          </div>
          <span className="text-[11px] text-[#087F8C] font-semibold">
            Zero Data Loss Guarantee
          </span>
        </div>
      </div>

      {/* Storage and Sync Queue Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Local Storage Stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-[#12304A] flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#087F8C]" />
              <span>Browser IndexedDB Local Storage</span>
            </h3>
            <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
              v1.0 Database
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <span className="text-xl font-bold text-[#12304A] block">{storageStats.assessments}</span>
              <span className="text-[11px] text-[#536779]">Assessments</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <span className="text-xl font-bold text-[#12304A] block">{storageStats.referrals}</span>
              <span className="text-[11px] text-[#536779]">Referrals</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <span className="text-xl font-bold text-[#12304A] block">{storageStats.followups}</span>
              <span className="text-[11px] text-[#536779]">Follow-ups</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <span className="text-xl font-bold text-[#12304A] block">{storageStats.patients}</span>
              <span className="text-[11px] text-[#536779]">Patients</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center col-span-2 sm:col-span-2">
              <span className="text-xl font-bold text-[#12304A] block">{storageStats.facilities}</span>
              <span className="text-[11px] text-[#536779]">Facilities in Directory</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#12304A] text-xs font-semibold rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5 text-[#087F8C]" />
              <span>Export JSON Backup</span>
            </button>

            <button
              onClick={handleResetData}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg transition border border-rose-200"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Reset Clean Demo</span>
            </button>
          </div>
        </div>

        {/* Pending Offline Sync Queue */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#087F8C]" />
              <h3 className="text-sm font-bold text-[#12304A]">
                Pending Offline Synchronization Queue
              </h3>
            </div>
            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
              {syncQueue.length} Queued
            </span>
          </div>

          {syncQueue.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {syncQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-[#12304A]">
                      [{item.type}] {item.action}
                    </span>
                    <span className="text-[11px] text-[#536779] block">
                      Queued: {new Date(item.queued_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-mono">
                    ID: {item.id.slice(-6)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg">
              No offline items pending. All records are in sync.
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing || syncQueue.length === 0 || isSimulatedOffline}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#087F8C] hover:bg-[#066670] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-lg transition shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Force Sync to Backend</span>
            </button>
          </div>
        </div>
      </div>

      {/* Safety & Clinical CDS Architecture Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-[#12304A] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#087F8C]" />
          <span>Clinical CDS Architecture & Privacy Notice</span>
        </h3>
        <p className="text-xs text-[#536779] leading-relaxed">
          SwasthyaRoute AI is engineered as an offline-first clinical decision support system adhering to India&apos;s National Health Mission (NHM) guidelines for ASHA workers. All risk thresholds and red-flag rules are deterministic, transparent, and explainable. No personal health records are sent to third-party commercial LLMs or unverified cloud endpoints.
        </p>
      </div>
    </div>
  );
}
