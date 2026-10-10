'use client';

import React, { useState, useEffect } from 'react';
import { offlineDB } from '@/lib/offline-db';
import { api } from '@/lib/api-client';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  UserCheck,
  Calendar,
  Activity,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const Header: React.FC = () => {
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    // Check initial state
    setIsSimulatedOffline(offlineDB.getSimulatedOffline());

    // Update date
    const now = new Date();
    setFormattedDate(
      now.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    );

    const checkQueue = async () => {
      try {
        const queue = await offlineDB.getSyncQueue();
        setPendingCount(queue.length);
      } catch {
        // ignore
      }
    };

    checkQueue();
    const interval = setInterval(checkQueue, 3000);

    const handleModeChange = (e: any) => {
      setIsSimulatedOffline(e.detail);
    };
    window.addEventListener('swasthya_offline_mode_changed', handleModeChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('swasthya_offline_mode_changed', handleModeChange);
    };
  }, []);

  const toggleOfflineSimulation = () => {
    const nextVal = !isSimulatedOffline;
    setIsSimulatedOffline(nextVal);
    offlineDB.setSimulatedOffline(nextVal);
    setSyncToast({
      message: nextVal
        ? '📴 Simulated Offline Mode Enabled. All assessments will be stored locally in IndexedDB.'
        : '🌐 Online Mode Restored. Ready for server synchronization.',
      type: nextVal ? 'info' : 'success',
    });
    setTimeout(() => setSyncToast(null), 4000);
  };

  const handleSyncNow = async () => {
    if (isSimulatedOffline) {
      setSyncToast({
        message: 'Cannot sync while Simulated Offline Mode is active. Switch to Online first.',
        type: 'error',
      });
      setTimeout(() => setSyncToast(null), 4000);
      return;
    }

    setIsSyncing(true);
    const result = await api.syncPendingWithBackend();
    setIsSyncing(false);

    const queue = await offlineDB.getSyncQueue();
    setPendingCount(queue.length);

    setSyncToast({
      message: result.message,
      type: result.success ? 'success' : 'error',
    });
    setTimeout(() => setSyncToast(null), 4000);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#12304A] flex items-center justify-center text-white shadow-xs">
            <Activity className="w-5 h-5 text-[#087F8C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-[#12304A] tracking-tight">
                Swasthya<span className="text-[#087F8C]">Route</span> <span className="text-xs bg-[#12304A] text-white px-1.5 py-0.5 rounded font-mono font-normal">AI</span>
              </span>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#EAF4F8] text-[#12304A] border border-[#087F8C]/20">
                Frontline CDS v1.0
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-[#536779] font-medium">
              Listen • Assess • Route • Follow Up
            </p>
          </div>
        </div>

        {/* Status and Profile Area */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Simulated Offline Toggle Button */}
          <button
            onClick={toggleOfflineSimulation}
            title={isSimulatedOffline ? 'Click to disable offline simulation' : 'Click to test offline resilience'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              isSimulatedOffline
                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {isSimulatedOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Offline Sim:</span>
                <span className="font-bold">ON</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Status:</span>
                <span className="font-semibold">Online</span>
              </>
            )}
          </button>

          {/* Sync Queue Button */}
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            title="Synchronize local IndexedDB queue with backend server"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              pendingCount > 0
                ? 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#087F8C]' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Sync</span>
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#087F8C] text-white">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Date Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#536779] bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-[#536779]" />
            <span>{formattedDate}</span>
          </div>

          {/* ASHA Worker Demo Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-[#EAF4F8] border border-[#087F8C]/30 flex items-center justify-center text-[#087F8C] font-semibold text-xs">
              SD
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-[#12304A]">Sunita Devi</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1 rounded">DEMO</span>
              </div>
              <p className="text-[10px] text-[#536779]">ASHA • Sector 4 Rampur</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Feedback Notification */}
      {syncToast && (
        <div
          className={`px-4 py-1.5 text-xs flex items-center justify-between border-t transition-all ${
            syncToast.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : syncToast.type === 'info'
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncToast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{syncToast.message}</span>
          </div>
          <button
            onClick={() => setSyncToast(null)}
            className="text-xs underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}
    </header>
  );
};
