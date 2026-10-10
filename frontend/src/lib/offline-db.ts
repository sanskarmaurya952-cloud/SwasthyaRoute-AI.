import {
  Patient,
  AssessmentResult,
  Referral,
  Facility,
  FollowUp,
  DashboardStats,
  SyncQueueItem,
} from '@/types';

const DB_NAME = 'SwasthyaRouteAI_OfflineDB';
const DB_VERSION = 1;

export const INITIAL_FACILITIES: Facility[] = [
  {
    id: 'FAC-DH-01',
    name: 'District Hospital (DH) Civil Medical Center',
    facility_type: 'District Hospital (DH)',
    village_or_block: 'District HQ (Civil Lines)',
    contact_phone: '+91 522 2390100 (Demo Helpline)',
    emergency_capability: true,
    oxygen_available: true,
    icu_beds_available: true,
    specialists_available: ['General Medicine', 'Pulmonology', 'Cardiology', 'Obstetrics & Gynaecology', 'Emergency Trauma'],
    distance_km_demo: 14.2,
    est_travel_time_demo: '25-30 mins',
    operating_hours: '24x7 Emergency & Inpatient',
    is_demo_data: true,
  },
  {
    id: 'FAC-CHC-02',
    name: 'Community Health Centre (CHC) Rampur',
    facility_type: 'Community Health Centre (CHC)',
    village_or_block: 'Rampur Block Center',
    contact_phone: '+91 522 2490200 (Demo Desk)',
    emergency_capability: true,
    oxygen_available: true,
    icu_beds_available: false,
    specialists_available: ['General Physician', 'Paediatrician', 'Gynaecologist', '24/7 Delivery Room'],
    distance_km_demo: 6.5,
    est_travel_time_demo: '12-15 mins',
    operating_hours: '24x7 Emergency Stabilisation & 30-Bed Inpatient',
    is_demo_data: true,
  },
  {
    id: 'FAC-PHC-03',
    name: 'Primary Health Centre (PHC) Chandanpur',
    facility_type: 'Primary Health Centre (PHC)',
    village_or_block: 'Chandanpur Village',
    contact_phone: '+91 522 2590300 (Demo PHC)',
    emergency_capability: false,
    oxygen_available: false,
    icu_beds_available: false,
    specialists_available: ['Medical Officer (MBBS)', 'Staff Nurse', 'Pharmacist'],
    distance_km_demo: 2.8,
    est_travel_time_demo: '6-8 mins',
    operating_hours: '9:00 AM - 4:00 PM (OPD)',
    is_demo_data: true,
  },
  {
    id: 'FAC-SHC-04',
    name: 'Sub-Health Centre (SHC) Kalyanpur',
    facility_type: 'Sub-Health Centre (SHC)',
    village_or_block: 'Kalyanpur Sector 2',
    contact_phone: '+91 522 2690400 (Demo ANM)',
    emergency_capability: false,
    oxygen_available: false,
    icu_beds_available: false,
    specialists_available: ['ANM (Auxiliary Nurse Midwife)', 'Community Health Officer (CHO)'],
    distance_km_demo: 1.2,
    est_travel_time_demo: '3-5 mins',
    operating_hours: '9:00 AM - 2:00 PM (ANC / Immunization / NCD)',
    is_demo_data: true,
  },
  {
    id: 'FAC-MED-05',
    name: 'Regional Institute of Medical Sciences (Tertiary/Super-Specialty)',
    facility_type: 'Tertiary / Medical College',
    village_or_block: 'State Capital Corridor',
    contact_phone: '+91 522 2790500 (Demo Trauma)',
    emergency_capability: true,
    oxygen_available: true,
    icu_beds_available: true,
    specialists_available: ['Advanced Respiratory ICU', 'Cardiac Cath Lab', 'Neonatal Intensive Care', 'Neurosurgery'],
    distance_km_demo: 38.5,
    est_travel_time_demo: '50-60 mins',
    operating_hours: '24x7 Tertiary Emergency & Super-Specialty',
    is_demo_data: true,
  },
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'PAT-DEMO-001',
    demo_identifier: 'PAT-2026-001',
    full_name: 'Rameshwar Sharma',
    age: 58,
    sex: 'Male',
    village: 'Rampur Kalan',
    phone_number: '+91 98765 43210',
    existing_conditions: ['Hypertension', 'Smoker'],
    pregnancy_status: false,
    notes: 'Reported sudden acute breathlessness and fever for 2 days.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'PAT-DEMO-002',
    demo_identifier: 'PAT-2026-002',
    full_name: 'Shanti Devi',
    age: 42,
    sex: 'Female',
    village: 'Chandanpur',
    phone_number: '+91 98765 43211',
    existing_conditions: ['Type 2 Diabetes'],
    pregnancy_status: false,
    notes: 'Seasonal cold and mild body ache.',
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: 'PAT-DEMO-003',
    demo_identifier: 'PAT-2026-003',
    full_name: 'Pooja Kumari',
    age: 24,
    sex: 'Female',
    village: 'Kalyanpur',
    phone_number: '+91 98765 43212',
    existing_conditions: [],
    pregnancy_status: true,
    notes: 'Third trimester ANC checkup; elevated BP noted at SHC.',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'PAT-DEMO-004',
    demo_identifier: 'PAT-2026-004',
    full_name: 'Mohammad Arif',
    age: 67,
    sex: 'Male',
    village: 'Rampur Block',
    phone_number: '+91 98765 43213',
    existing_conditions: ['COPD', 'Coronary Artery Disease'],
    pregnancy_status: false,
    notes: 'Chronic cough with yellow sputum, needs CHC review.',
    created_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
  },
];

export const INITIAL_ASSESSMENTS: AssessmentResult[] = [
  {
    id: 'ASSESS-20261009-DEMO01',
    patient_id: 'PAT-DEMO-001',
    patient_name: 'Rameshwar Sharma',
    patient_age: 58,
    patient_village: 'Rampur Kalan',
    symptoms: ['Breathlessness', 'Fever', 'Cough'],
    symptom_duration: '2 days',
    vitals: {
      heart_rate: 112,
      spo2: 89.0,
      temperature: 101.4,
      respiratory_rate: 28,
      systolic_bp: 142,
      diastolic_bp: 88,
    },
    voice_transcript: 'Patient ko saans lene mein dikkat hai aur fever hai.',
    risk_category: 'HIGH',
    urgency: 'EMERGENCY_IMMEDIATE',
    score: 85,
    triggered_rules: [
      {
        rule_id: 'RF-SPO2-CRITICAL',
        rule_name: 'Critical Hypoxemia (SpO2 < 90%)',
        severity: 'CRITICAL',
        clinical_rationale: 'Measured SpO2 is 89.0%, critically below 95%. Immediate supplemental oxygen required.',
        suggested_level: 'District Hospital (DH)',
      },
      {
        rule_id: 'RF-RESP-SPO2-SYNERGY',
        rule_name: 'Combined Breathlessness with Low SpO2',
        severity: 'CRITICAL',
        clinical_rationale: 'Acute shortness of breath paired with sub-90% SpO2 indicates acute respiratory failure.',
        suggested_level: 'District Hospital (DH) / CHC Emergency',
      },
      {
        rule_id: 'RF-SYNERGY-FEVER-BREATH',
        rule_name: 'Dual Triad: Fever + Breathlessness',
        severity: 'CRITICAL',
        clinical_rationale: 'Fever with dyspnea suggests acute lower respiratory tract infection / pneumonia.',
        suggested_level: 'CHC or District Hospital',
      },
    ],
    feature_contributions: [
      {
        feature_name: 'Oxygen Saturation (SpO2)',
        value: '89.0%',
        risk_impact: 'HIGH_RISK_TRIGGER',
        points_weight: 50,
        note: 'Severe hypoxia requiring immediate oxygen.',
      },
      {
        feature_name: 'Reported Breathlessness',
        value: 'Yes (Active)',
        risk_impact: 'HIGH_RISK_TRIGGER',
        points_weight: 25,
        note: 'Severe respiratory compromise.',
      },
      {
        feature_name: 'Body Temperature',
        value: '101.4°F',
        risk_impact: 'MODERATE_RISK',
        points_weight: 10,
        note: 'Active fever.',
      },
    ],
    recommended_care_level: 'District Hospital (DH)',
    recommended_action: '🚨 IMMEDIATE ESCALATION REQUIRED: Patient exhibits critical hypoxemia (89%). Call 108 ambulance immediately.',
    facility_options: [
      {
        id: 'FAC-DH-01',
        name: 'District Hospital (DH) Civil Medical Center',
        facility_type: 'District Hospital (DH)',
        distance_km: 14.2,
        est_time: '25-30 mins',
        emergency_ready: true,
        oxygen_supported: true,
        match_reason: 'Equipped with 24/7 ICU, oxygen manifold, and specialist physicians.',
      },
    ],
    human_review_status: 'Pending ASHA Confirmation',
    created_at: new Date().toISOString(),
    is_demo_case: true,
    disclaimer: 'Prototype clinical decision support rule engine. Not certified for autonomous diagnosis.',
  },
  {
    id: 'ASSESS-20261009-DEMO02',
    patient_id: 'PAT-DEMO-002',
    patient_name: 'Shanti Devi',
    patient_age: 42,
    patient_village: 'Chandanpur',
    symptoms: ['Mild headache', 'Body ache'],
    symptom_duration: '1 day',
    vitals: {
      heart_rate: 78,
      spo2: 98.0,
      temperature: 98.6,
      respiratory_rate: 18,
      systolic_bp: 124,
      diastolic_bp: 78,
    },
    voice_transcript: 'Patient bol rahi hain halka sar dard hai.',
    risk_category: 'LOW',
    urgency: 'ROUTINE_SCHEDULED',
    score: 5,
    triggered_rules: [],
    feature_contributions: [
      {
        feature_name: 'Oxygen Saturation (SpO2)',
        value: '98.0%',
        risk_impact: 'NORMAL',
        points_weight: 0,
        note: 'Healthy baseline reading.',
      },
    ],
    recommended_care_level: 'Primary Health Centre (PHC)',
    recommended_action: '✅ ROUTINE / PRIMARY CARE: Routine care and home hydration advice. Sub-centre follow-up in 3 days.',
    facility_options: [],
    human_review_status: 'ASHA Verified',
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    is_demo_case: false,
    disclaimer: 'Prototype clinical decision support.',
  },
];

export const INITIAL_REFERRALS: Referral[] = [
  {
    id: 'REF-2026-001',
    assessment_id: 'ASSESS-20261009-DEMO01',
    patient_id: 'PAT-DEMO-001',
    patient_name: 'Rameshwar Sharma',
    patient_age: 58,
    patient_village: 'Rampur Kalan',
    destination_facility_id: 'FAC-DH-01',
    destination_facility_name: 'District Hospital (DH) Civil Medical Center',
    destination_facility_type: 'District Hospital (DH)',
    risk_category: 'HIGH',
    urgency: 'EMERGENCY_IMMEDIATE',
    reason: 'Severe Hypoxia (SpO2 89%) with Acute Breathlessness and Fever',
    status: 'In Transit',
    status_history: [
      { status: 'Pending Review', timestamp: new Date(Date.now() - 45 * 60000).toISOString(), by: 'System Assessment' },
      { status: 'Approved', timestamp: new Date(Date.now() - 35 * 60000).toISOString(), by: 'ASHA Worker Sunita Devi' },
      { status: 'In Transit', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), by: '108 Ambulance Unit #14' },
    ],
    created_at: new Date().toISOString(),
    reviewed_by: 'Demo ASHA Worker (Sunita Devi)',
    transport_mode: '108 Emergency Ambulance (Dispatched)',
    notes: 'Oxygen cylinder requested on-board. MO notified at District Hospital.',
  },
  {
    id: 'REF-2026-002',
    assessment_id: 'ASSESS-20261008-DEMO03',
    patient_id: 'PAT-DEMO-003',
    patient_name: 'Pooja Kumari',
    patient_age: 24,
    patient_village: 'Kalyanpur',
    destination_facility_id: 'FAC-CHC-02',
    destination_facility_name: 'Community Health Centre (CHC) Rampur',
    destination_facility_type: 'Community Health Centre (CHC)',
    risk_category: 'MODERATE',
    urgency: 'URGENT_SAME_DAY',
    reason: 'Gestational hypertension screening (BP 146/94 mmHg)',
    status: 'Visit Completed',
    status_history: [
      { status: 'Pending Review', timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), by: 'System' },
      { status: 'Approved', timestamp: new Date(Date.now() - 23 * 3600000).toISOString(), by: 'ASHA Worker Sunita Devi' },
      { status: 'Visit Completed', timestamp: new Date(Date.now() - 18 * 3600000).toISOString(), by: 'Dr. Verma (CHC Medical Officer)' },
    ],
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    reviewed_by: 'Demo ASHA Worker (Sunita Devi)',
    transport_mode: 'Community Auto-Rickshaw',
    notes: 'Doctor prescribed Methyldopa and scheduled weekly protein urine tests.',
  },
];

export const INITIAL_FOLLOWUPS: FollowUp[] = [
  {
    id: 'FOL-2026-001',
    referral_id: 'REF-2026-001',
    patient_id: 'PAT-DEMO-001',
    patient_name: 'Rameshwar Sharma',
    patient_village: 'Rampur Kalan',
    due_date: new Date(Date.now() + 24 * 3600000).toISOString().split('T')[0],
    status: 'Due',
    follow_up_reason: 'Verify post-admission oxygen stabilization and discharge summary from District Hospital.',
    notes: 'Family notified. ASHA home visit scheduled for tomorrow morning.',
    created_at: new Date().toISOString(),
    completed_at: null,
  },
  {
    id: 'FOL-2026-002',
    referral_id: 'REF-2026-002',
    patient_id: 'PAT-DEMO-003',
    patient_name: 'Pooja Kumari',
    patient_village: 'Kalyanpur',
    due_date: new Date().toISOString().split('T')[0],
    status: 'Due',
    follow_up_reason: 'Check daily BP compliance and adherence to prescribed antihypertensive tablets.',
    notes: 'Patient taking medication properly; check BP again at Sub-centre.',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    completed_at: null,
  },
  {
    id: 'FOL-2026-003',
    referral_id: null,
    patient_id: 'PAT-DEMO-004',
    patient_name: 'Mohammad Arif',
    patient_village: 'Rampur Block',
    due_date: new Date(Date.now() - 48 * 3600000).toISOString().split('T')[0],
    status: 'Missed',
    follow_up_reason: 'Monthly COPD inhaler compliance check.',
    notes: "Patient was traveling to relative's house during scheduled visit.",
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    completed_at: null,
  },
  {
    id: 'FOL-2026-004',
    referral_id: null,
    patient_id: 'PAT-DEMO-002',
    patient_name: 'Shanti Devi',
    patient_village: 'Chandanpur',
    due_date: new Date(Date.now() - 24 * 3600000).toISOString().split('T')[0],
    status: 'Completed',
    follow_up_reason: 'Check recovery from seasonal headache/malaise.',
    notes: 'Patient fully recovered, vitals checked normal at home visit.',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    completed_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
];

class OfflineDB {
  private db: IDBDatabase | null = null;
  private isSimulatedOffline: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('swasthya_simulated_offline');
      this.isSimulatedOffline = stored === 'true';
    }
  }

  public getSimulatedOffline(): boolean {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('swasthya_simulated_offline');
      this.isSimulatedOffline = stored === 'true';
    }
    return this.isSimulatedOffline;
  }

  public setSimulatedOffline(val: boolean) {
    this.isSimulatedOffline = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('swasthya_simulated_offline', val ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('swasthya_offline_mode_changed', { detail: val }));
    }
  }

  public async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        return reject(new Error('IndexedDB not supported on server'));
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('patients')) {
          db.createObjectStore('patients', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('assessments')) {
          db.createObjectStore('assessments', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('referrals')) {
          db.createObjectStore('referrals', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('followups')) {
          db.createObjectStore('followups', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('facilities')) {
          db.createObjectStore('facilities', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        await this.seedInitialDataIfEmpty();
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  private async seedInitialDataIfEmpty() {
    const facilities = await this.getAll<Facility>('facilities');
    if (facilities.length === 0) {
      for (const f of INITIAL_FACILITIES) {
        await this.put('facilities', f);
      }
      for (const p of INITIAL_PATIENTS) {
        await this.put('patients', p);
      }
      for (const a of INITIAL_ASSESSMENTS) {
        await this.put('assessments', a);
      }
      for (const r of INITIAL_REFERRALS) {
        await this.put('referrals', r);
      }
      for (const fol of INITIAL_FOLLOWUPS) {
        await this.put('followups', fol);
      }
    }
  }

  public async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  public async get<T>(storeName: string, id: string): Promise<T | null> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  public async put<T>(storeName: string, item: T): Promise<T> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve(item);
      request.onerror = () => reject(request.error);
    });
  }

  public async delete(storeName: string, id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'queued_at' | 'attempts'>): Promise<SyncQueueItem> {
    const queueItem: SyncQueueItem = {
      id: `SYNC-${Date.now()}-${Math.random().toString(16).substring(2, 6)}`,
      queued_at: new Date().toISOString(),
      attempts: 0,
      ...item,
    };
    await this.put('syncQueue', queueItem);
    return queueItem;
  }

  public async getSyncQueue(): Promise<SyncQueueItem[]> {
    return this.getAll<SyncQueueItem>('syncQueue');
  }

  public async clearSyncQueueItem(id: string): Promise<void> {
    return this.delete('syncQueue', id);
  }

  public async getDashboardStats(): Promise<DashboardStats> {
    const assessments = await this.getAll<AssessmentResult>('assessments');
    const referrals = await this.getAll<Referral>('referrals');
    const followups = await this.getAll<FollowUp>('followups');

    const todayStr = new Date().toISOString().split('T')[0];
    const assessedToday = assessments.filter((a) => a.created_at.startsWith(todayStr)).length;
    const highRisk = assessments.filter((a) => a.risk_category === 'HIGH').length;
    const refPending = referrals.filter((r) => ['Pending Review', 'Approved', 'In Transit'].includes(r.status)).length;
    const folDue = followups.filter((f) => f.status === 'Due').length;
    const missedFol = followups.filter((f) => f.status === 'Missed').length;

    const urgency_distribution: Record<string, number> = {
      EMERGENCY_IMMEDIATE: 0,
      URGENT_SAME_DAY: 0,
      ROUTINE_SCHEDULED: 0,
      HOME_CARE_MONITORING: 0,
    };

    assessments.forEach((a) => {
      if (urgency_distribution[a.urgency] !== undefined) {
        urgency_distribution[a.urgency] += 1;
      }
    });

    const recent_assessments = [...assessments].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);
    const recent_referrals = [...referrals].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);
    const pending_followups_list = followups.filter((f) => f.status === 'Due').sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 5);

    const isSim = this.getSimulatedOffline();

    return {
      patients_assessed_today: assessedToday,
      high_risk_assessments: highRisk,
      referrals_pending: refPending,
      followups_due: folDue,
      missed_followups: missedFol,
      sync_status: isSim ? 'Simulated Offline (Local Cache)' : 'Online (Synchronized)',
      last_sync_timestamp: new Date().toISOString(),
      urgency_distribution,
      recent_assessments,
      recent_referrals,
      pending_followups_list,
    };
  }

  public async resetToDemo(): Promise<void> {
    const db = await this.init();
    const stores = ['patients', 'assessments', 'referrals', 'followups', 'facilities', 'syncQueue'];
    for (const storeName of stores) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }
    await this.seedInitialDataIfEmpty();
  }
}

export const offlineDB = new OfflineDB();
