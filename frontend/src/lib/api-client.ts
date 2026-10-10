import {
  Patient,
  AssessmentResult,
  Referral,
  Facility,
  FollowUp,
  DashboardStats,
  VitalsInput,
} from '@/types';
import { offlineDB } from './offline-db';
import { evaluateTriageClient } from './triage-rules';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private isOnline(): boolean {
    if (typeof window === 'undefined') return true;
    if (offlineDB.getSimulatedOffline()) return false;
    return navigator.onLine;
  }

  // Dashboard Stats
  public async getDashboardStats(): Promise<DashboardStats> {
    if (this.isOnline()) {
      try {
        const res = await fetch(`${API_BASE}/api/dashboard`, { cache: 'no-store' });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Backend unavailable, fallback to IndexedDB:', err);
      }
    }
    return offlineDB.getDashboardStats();
  }

  // List Patients
  public async getPatients(): Promise<Patient[]> {
    if (this.isOnline()) {
      try {
        const res = await fetch(`${API_BASE}/api/patients`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          // Update local cache
          for (const p of data) {
            await offlineDB.put('patients', p);
          }
          return data;
        }
      } catch (err) {
        console.warn('Backend unavailable, fallback to IndexedDB:', err);
      }
    }
    return offlineDB.getAll<Patient>('patients');
  }

  // Create Patient
  public async createPatient(patient: Omit<Patient, 'id' | 'created_at'>): Promise<Patient> {
    const id = `PAT-${Date.now()}-${Math.random().toString(16).substring(2, 6).toUpperCase()}`;
    const newPatient: Patient = {
      ...patient,
      id,
      created_at: new Date().toISOString(),
    };

    if (this.isOnline()) {
      try {
        const res = await fetch(`${API_BASE}/api/patients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patient),
        });
        if (res.ok) {
          const serverPatient = await res.json();
          await offlineDB.put('patients', serverPatient);
          return serverPatient;
        }
      } catch (err) {
        console.warn('Backend create failed, queuing offline:', err);
      }
    }

    await offlineDB.put('patients', newPatient);
    await offlineDB.addToSyncQueue({
      type: 'ASSESSMENT',
      action: 'CREATE',
      data: newPatient,
    });
    return newPatient;
  }

  // Create Assessment
  public async createAssessment(params: {
    patient_info?: {
      demo_identifier: string;
      full_name: string;
      age: number;
      sex?: string;
      village: string;
      phone_number?: string;
      existing_conditions: string[];
      pregnancy_status?: boolean;
      notes?: string;
    };
    patient_id?: string;
    symptoms: string[];
    symptom_duration?: string;
    vitals: VitalsInput;
    voice_transcript?: string;
    language_used?: string;
    asha_notes?: string;
  }): Promise<AssessmentResult> {
    if (this.isOnline()) {
      try {
        const res = await fetch(`${API_BASE}/api/assessments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
        if (res.ok) {
          const assessment = await res.json();
          await offlineDB.put('assessments', assessment);
          return assessment;
        }
      } catch (err) {
        console.warn('Backend evaluation failed, using client triage rules:', err);
      }
    }

    // Client-side offline deterministic rule engine fallback
    const pName = params.patient_info?.full_name || 'Demo Patient';
    const pAge = params.patient_info?.age || 58;
    const pVillage = params.patient_info?.village || 'Rampur Block';

    const localAssessment = evaluateTriageClient({
      patientName: pName,
      patientAge: pAge,
      patientVillage: pVillage,
      patientId: params.patient_id,
      symptoms: params.symptoms,
      symptomDuration: params.symptom_duration,
      vitals: params.vitals,
      voiceTranscript: params.voice_transcript,
      ashaNotes: params.asha_notes,
    });

    await offlineDB.put('assessments', localAssessment);
    await offlineDB.addToSyncQueue({
      type: 'ASSESSMENT',
      action: 'CREATE',
      data: localAssessment,
    });

    return localAssessment;
  }

  // Get Assessments
  public async getAssessments(): Promise<AssessmentResult[]> {
    if (this.isOnline()) {
      try {
        const res = await fetch(`${API_BASE}/api/assessments`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          for (const a of data) {
            await offlineDB.put('assessments', a);
          }
          return data;
        }
      } catch (err) {
        console.warn('Backend unavailable, fallback to IndexedDB:', err);
      }
    }
    return offlineDB.getAll<AssessmentResult>('assessments');
  }

  // List Referrals
  public async getReferrals(): Promise<Referral[]> {
    if (this.isOnline()) {
      try {
        const res = await fetch(`${API_BASE}/api/referrals`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          for (const r of data) {
            await offlineDB.put('referrals', r);
          }
          return data;
        }
      } catch (err) {
        console.warn('Backend unavailable, fallback to IndexedDB:', err);
      }
    }
    return offlineDB.getAll<Referral>('referrals');
  }

  // Create Referral
  public async createReferral(payload: {
    assessment_id: string;
    patient_id: string;
    destination_facility_id: string;
    reason: string;
    urgency: string;
    notes?: string;
  }): Promise<Referral> {
    if (this.isOnline()) {
      try {
        const res = await fetch(`${API_BASE}/api/referrals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const referral = await res.json();
          await offlineDB.put('referrals', referral);
          return referral;
        }
      } catch (err) {
        console.warn('Backend referral failed, creating in IndexedDB:', err);
      }
    }

    // Offline create referral
    const assess = await offlineDB.get<AssessmentResult>('assessments', payload.assessment_id);
    const facilities = await offlineDB.getAll<Facility>('facilities');
    const fac = facilities.find((f) => f.id === payload.destination_facility_id);

    const refId = `REF-${new Date().getFullYear()}-${Math.random().toString(16).substring(2, 6).toUpperCase()}`;
    const now = new Date().toISOString();

    const localReferral: Referral = {
      id: refId,
      assessment_id: payload.assessment_id,
      patient_id: payload.patient_id,
      patient_name: assess?.patient_name || 'Demo Patient',
      patient_age: assess?.patient_age || 58,
      patient_village: assess?.patient_village || 'Rampur Kalan',
      destination_facility_id: payload.destination_facility_id,
      destination_facility_name: fac?.name || 'District Hospital Civil Center',
      destination_facility_type: fac?.facility_type || 'District Hospital (DH)',
      risk_category: assess?.risk_category || 'HIGH',
      urgency: (payload.urgency as any) || 'EMERGENCY_IMMEDIATE',
      reason: payload.reason,
      status: 'Approved',
      status_history: [
        { status: 'Pending Review', timestamp: now, by: 'System Assessment' },
        { status: 'Approved', timestamp: now, by: 'ASHA Worker (Sunita Devi)' },
      ],
      created_at: now,
      reviewed_by: 'Demo ASHA Worker (Sunita Devi)',
      transport_mode: assess?.risk_category === 'HIGH' ? '108 Emergency Ambulance (Dispatched)' : 'Local Transport',
      notes: payload.notes || 'Emergency referral initiated offline.',
    };

    await offlineDB.put('referrals', localReferral);

    // Auto schedule follow-up
    const folId = `FOL-${new Date().getFullYear()}-${Math.random().toString(16).substring(2, 6).toUpperCase()}`;
    const localFol: FollowUp = {
      id: folId,
      referral_id: refId,
      patient_id: payload.patient_id,
      patient_name: localReferral.patient_name,
      patient_village: localReferral.patient_village,
      due_date: new Date().toISOString().split('T')[0],
      status: 'Due',
      follow_up_reason: `Post-referral checkup: ${payload.reason.slice(0, 50)}`,
      notes: `Auto-created for referral ${refId}. Verify facility arrival.`,
      created_at: now,
      completed_at: null,
    };
    await offlineDB.put('followups', localFol);

    await offlineDB.addToSyncQueue({
      type: 'REFERRAL',
      action: 'CREATE',
      data: localReferral,
    });

    return localReferral;
  }

  // Update Referral
  public async updateReferral(
    referralId: string,
    updates: {
      status?: string;
      notes?: string;
      transport_mode?: string;
      reviewed_by?: string;
    }
  ): Promise<Referral | null> {
    if (this.isOnline()) {
      try {
        const res = await fetch(`${API_BASE}/api/referrals/${referralId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const updated = await res.json();
          await offlineDB.put('referrals', updated);
          return updated;
        }
      } catch (err) {
        console.warn('Backend update failed, applying in IndexedDB:', err);
      }
    }

    const current = await offlineDB.get<Referral>('referrals', referralId);
    if (!current) return null;

    const history = [...current.status_history];
    if (updates.status && updates.status !== current.status) {
      history.push({
        status: updates.status,
        timestamp: new Date().toISOString(),
        by: updates.reviewed_by || 'Demo ASHA Worker (Sunita Devi)',
      });
    }

    const updated: Referral = {
      ...current,
      status: (updates.status as any) || current.status,
      notes: updates.notes !== undefined ? updates.notes : current.notes,
      transport_mode: updates.transport_mode !== undefined ? updates.transport_mode : current.transport_mode,
      reviewed_by: updates.reviewed_by !== undefined ? updates.reviewed_by : current.reviewed_by,
      status_history: history,
    };

    await offlineDB.put('referrals', updated);
    await offlineDB.addToSyncQueue({
      type: 'REFERRAL',
      action: 'UPDATE',
      data: updated,
    });

    return updated;
  }

  // List Followups
  public async getFollowups(): Promise<FollowUp[]> {
    if (this.isOnline()) {
      try {
        const res = await fetch(`${API_BASE}/api/followups`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          for (const f of data) {
            await offlineDB.put('followups', f);
          }
          return data;
        }
      } catch (err) {
        console.warn('Backend unavailable, fallback to IndexedDB:', err);
      }
    }
    return offlineDB.getAll<FollowUp>('followups');
  }

  // Update Followup
  public async updateFollowup(
    followupId: string,
    updates: {
      status?: string;
      due_date?: string;
      notes?: string;
    }
  ): Promise<FollowUp | null> {
    if (this.isOnline()) {
      try {
        const res = await fetch(`${API_BASE}/api/followups/${followupId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const updated = await res.json();
          await offlineDB.put('followups', updated);
          return updated;
        }
      } catch (err) {
        console.warn('Backend update followup failed, using IndexedDB:', err);
      }
    }

    const current = await offlineDB.get<FollowUp>('followups', followupId);
    if (!current) return null;

    const updated: FollowUp = {
      ...current,
      status: (updates.status as any) || current.status,
      due_date: updates.due_date || current.due_date,
      notes: updates.notes !== undefined ? updates.notes : current.notes,
      completed_at: updates.status === 'Completed' ? new Date().toISOString() : current.completed_at,
    };

    await offlineDB.put('followups', updated);
    await offlineDB.addToSyncQueue({
      type: 'FOLLOWUP',
      action: 'UPDATE',
      data: updated,
    });

    return updated;
  }

  // List Facilities
  public async getFacilities(): Promise<Facility[]> {
    if (this.isOnline()) {
      try {
        const res = await fetch(`${API_BASE}/api/facilities`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          for (const f of data) {
            await offlineDB.put('facilities', f);
          }
          return data;
        }
      } catch (err) {
        console.warn('Backend facilities failed, fallback to IndexedDB:', err);
      }
    }
    return offlineDB.getAll<Facility>('facilities');
  }

  // Sync Queue with Backend
  public async syncPendingWithBackend(): Promise<{ success: boolean; syncedCount: number; message: string }> {
    const queue = await offlineDB.getSyncQueue();
    if (queue.length === 0) {
      return { success: true, syncedCount: 0, message: 'All local records are synchronized.' };
    }

    const assessments = queue.filter((q) => q.type === 'ASSESSMENT').map((q) => q.data);
    const referrals = queue.filter((q) => q.type === 'REFERRAL').map((q) => q.data);
    const followups = queue.filter((q) => q.type === 'FOLLOWUP').map((q) => q.data);

    try {
      const res = await fetch(`${API_BASE}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessments, referrals, followups }),
      });

      if (res.ok) {
        for (const item of queue) {
          await offlineDB.clearSyncQueueItem(item.id);
        }
        return {
          success: true,
          syncedCount: queue.length,
          message: `Successfully synchronized ${queue.length} offline records to server.`,
        };
      }
      return { success: false, syncedCount: 0, message: `Server returned status ${res.status}` };
    } catch (err: any) {
      return {
        success: false,
        syncedCount: 0,
        message: `Sync failed: ${err.message || 'Network unreachable'}. Local records remain safely queued.`,
      };
    }
  }

  // Reset Demo
  public async resetDemoData(): Promise<void> {
    await offlineDB.resetToDemo();
    try {
      await fetch(`${API_BASE}/api/reset-demo`, { method: 'POST' });
    } catch (err) {
      console.log('Reset backend error (offline mode):', err);
    }
  }
}

export const api = new ApiClient();
