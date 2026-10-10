export type RiskCategory = 'HIGH' | 'MODERATE' | 'LOW' | 'UNKNOWN';

export type UrgencyLevel =
  | 'EMERGENCY_IMMEDIATE'
  | 'URGENT_SAME_DAY'
  | 'ROUTINE_SCHEDULED'
  | 'HOME_CARE_MONITORING';

export type ReferralStatus =
  | 'Pending Review'
  | 'Approved'
  | 'In Transit'
  | 'Visit Completed'
  | 'Cancelled';

export type FollowUpStatus = 'Due' | 'Completed' | 'Missed';

export type FacilityType =
  | 'Sub-Health Centre (SHC)'
  | 'Primary Health Centre (PHC)'
  | 'Community Health Centre (CHC)'
  | 'District Hospital (DH)'
  | 'Tertiary / Medical College';

export interface VitalsInput {
  heart_rate?: number | null;
  spo2?: number | null;
  temperature?: number | null;
  respiratory_rate?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  blood_glucose?: number | null;
}

export interface Patient {
  id: string;
  demo_identifier: string;
  full_name: string;
  age: number;
  sex?: string;
  village: string;
  phone_number?: string;
  existing_conditions: string[];
  pregnancy_status?: boolean;
  notes?: string;
  created_at: string;
}

export interface TriggeredRule {
  rule_id: string;
  rule_name: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  clinical_rationale: string;
  suggested_level: string;
}

export interface FeatureContribution {
  feature_name: string;
  value: string | number;
  risk_impact: 'HIGH_RISK_TRIGGER' | 'MODERATE_RISK' | 'NORMAL';
  points_weight: number;
  note: string;
}

export interface FacilityOption {
  id: string;
  name: string;
  facility_type: string;
  distance_km: number;
  est_time: string;
  emergency_ready: boolean;
  oxygen_supported: boolean;
  match_reason: string;
}

export interface AssessmentResult {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_age: number;
  patient_village: string;
  symptoms: string[];
  symptom_duration?: string;
  vitals: VitalsInput;
  voice_transcript?: string;
  risk_category: RiskCategory;
  urgency: UrgencyLevel;
  score: number;
  triggered_rules: TriggeredRule[];
  feature_contributions: FeatureContribution[];
  recommended_care_level: FacilityType;
  recommended_action: string;
  facility_options: FacilityOption[];
  human_review_status: string;
  created_at: string;
  is_demo_case?: boolean;
  disclaimer?: string;
}

export interface ReferralStatusHistory {
  status: string;
  timestamp: string;
  by: string;
}

export interface Referral {
  id: string;
  assessment_id: string;
  patient_id: string;
  patient_name: string;
  patient_age: number;
  patient_village: string;
  destination_facility_id: string;
  destination_facility_name: string;
  destination_facility_type: string;
  risk_category: RiskCategory;
  urgency: UrgencyLevel;
  reason: string;
  status: ReferralStatus;
  status_history: ReferralStatusHistory[];
  created_at: string;
  reviewed_by?: string;
  transport_mode?: string;
  notes?: string;
}

export interface Facility {
  id: string;
  name: string;
  facility_type: FacilityType;
  village_or_block: string;
  contact_phone: string;
  emergency_capability: boolean;
  oxygen_available: boolean;
  icu_beds_available: boolean;
  specialists_available: string[];
  distance_km_demo: number;
  est_travel_time_demo: string;
  operating_hours: string;
  is_demo_data: boolean;
}

export interface FollowUp {
  id: string;
  referral_id?: string | null;
  patient_id: string;
  patient_name: string;
  patient_village: string;
  due_date: string;
  status: FollowUpStatus;
  follow_up_reason: string;
  notes?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface DashboardStats {
  patients_assessed_today: number;
  high_risk_assessments: number;
  referrals_pending: number;
  followups_due: number;
  missed_followups: number;
  sync_status: string;
  last_sync_timestamp: string;
  urgency_distribution: Record<string, number>;
  recent_assessments: AssessmentResult[];
  recent_referrals: Referral[];
  pending_followups_list: FollowUp[];
}

export interface SyncQueueItem {
  id: string;
  type: 'ASSESSMENT' | 'REFERRAL' | 'FOLLOWUP';
  action: 'CREATE' | 'UPDATE';
  data: any;
  queued_at: string;
  attempts: number;
}
