"""Data models for SwasthyaRoute AI."""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class RiskCategory(str, Enum):
    HIGH = "HIGH"
    MODERATE = "MODERATE"
    LOW = "LOW"
    UNKNOWN = "UNKNOWN"


class UrgencyLevel(str, Enum):
    EMERGENCY_IMMEDIATE = "EMERGENCY_IMMEDIATE"
    URGENT_SAME_DAY = "URGENT_SAME_DAY"
    ROUTINE_SCHEDULED = "ROUTINE_SCHEDULED"
    HOME_CARE_MONITORING = "HOME_CARE_MONITORING"


class ReferralStatus(str, Enum):
    PENDING_REVIEW = "Pending Review"
    APPROVED = "Approved"
    IN_TRANSIT = "In Transit"
    VISIT_COMPLETED = "Visit Completed"
    CANCELLED = "Cancelled"


class FollowUpStatus(str, Enum):
    DUE = "Due"
    COMPLETED = "Completed"
    MISSED = "Missed"


class FacilityType(str, Enum):
    SUB_CENTRE = "Sub-Health Centre (SHC)"
    PHC = "Primary Health Centre (PHC)"
    CHC = "Community Health Centre (CHC)"
    DISTRICT_HOSPITAL = "District Hospital (DH)"
    TERTIARY_MEDICAL_COLLEGE = "Tertiary / Medical College"


class VitalsInput(BaseModel):
    heart_rate: Optional[int] = Field(None, description="Heart rate in beats per minute (BPM)")
    spo2: Optional[float] = Field(None, description="Oxygen saturation in percentage (%)")
    temperature: Optional[float] = Field(None, description="Body temperature in Fahrenheit (°F)")
    respiratory_rate: Optional[int] = Field(None, description="Respiratory rate in breaths per minute")
    systolic_bp: Optional[int] = Field(None, description="Systolic Blood Pressure (mmHg)")
    diastolic_bp: Optional[int] = Field(None, description="Diastolic Blood Pressure (mmHg)")
    blood_glucose: Optional[int] = Field(None, description="Random Blood Glucose (mg/dL)")


class PatientBase(BaseModel):
    demo_identifier: str = Field(..., description="Unique anonymized demo identifier, e.g. PAT-2026-001")
    full_name: str = Field(..., description="Patient name or demo alias")
    age: int = Field(..., description="Age in years")
    sex: Optional[str] = Field("Unspecified", description="Female, Male, or Other")
    village: str = Field(..., description="Village or settlement name")
    phone_number: Optional[str] = Field(None, description="Demo contact number")
    existing_conditions: List[str] = Field(default_factory=list, description="Pre-existing medical history, e.g. Diabetes, Hypertension, Asthma")
    pregnancy_status: Optional[bool] = Field(False, description="Whether the patient is currently pregnant")
    notes: Optional[str] = Field(None, description="Additional frontline notes")


class PatientCreate(PatientBase):
    pass


class Patient(PatientBase):
    id: str
    created_at: str


class TriggeredRule(BaseModel):
    rule_id: str
    rule_name: str
    severity: str  # CRITICAL, WARNING, INFO
    clinical_rationale: str
    suggested_level: str


class FeatureContribution(BaseModel):
    feature_name: str
    value: Any
    risk_impact: str  # HIGH_RISK_TRIGGER, MODERATE_RISK, NORMAL
    points_weight: int
    note: str


class AssessmentInput(BaseModel):
    patient_id: Optional[str] = None
    patient_info: Optional[PatientBase] = None
    symptoms: List[str] = Field(default_factory=list, description="List of recognized symptoms")
    symptom_duration: Optional[str] = Field("1-2 days", description="Duration of symptoms")
    vitals: VitalsInput = Field(default_factory=VitalsInput)
    voice_transcript: Optional[str] = Field(None, description="Captured Hindi/English voice transcript")
    language_used: Optional[str] = Field("hi-IN", description="Speech recognition language")
    asha_notes: Optional[str] = Field(None, description="ASHA worker specific observation")


class AssessmentResult(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    patient_age: int
    patient_village: str
    symptoms: List[str]
    symptom_duration: Optional[str]
    vitals: VitalsInput
    voice_transcript: Optional[str]
    risk_category: RiskCategory
    urgency: UrgencyLevel
    score: int
    triggered_rules: List[TriggeredRule]
    feature_contributions: List[FeatureContribution]
    recommended_care_level: FacilityType
    recommended_action: str
    facility_options: List[Dict[str, Any]] = Field(default_factory=list)
    human_review_status: str = Field("Pending ASHA Confirmation", description="Pending ASHA Confirmation / ASHA Verified")
    created_at: str
    is_demo_case: bool = False
    disclaimer: str = (
        "Prototype clinical decision support rule engine. Not certified for autonomous diagnosis. "
        "ASHA workers must adhere to standard NHM/MoHFW emergency escalation protocols."
    )


class ReferralCreate(BaseModel):
    assessment_id: str
    patient_id: str
    destination_facility_id: str
    reason: str
    urgency: UrgencyLevel
    notes: Optional[str] = None


class Referral(BaseModel):
    id: str
    assessment_id: str
    patient_id: str
    patient_name: str
    patient_age: int
    patient_village: str
    destination_facility_id: str
    destination_facility_name: str
    destination_facility_type: str
    risk_category: RiskCategory
    urgency: UrgencyLevel
    reason: str
    status: ReferralStatus
    status_history: List[Dict[str, str]] = Field(default_factory=list)
    created_at: str
    reviewed_by: Optional[str] = "Demo ASHA Worker (Sunita Devi)"
    transport_mode: Optional[str] = "108 Ambulance Requested"
    notes: Optional[str] = None


class ReferralUpdate(BaseModel):
    status: Optional[ReferralStatus] = None
    destination_facility_id: Optional[str] = None
    transport_mode: Optional[str] = None
    notes: Optional[str] = None
    reviewed_by: Optional[str] = None


class Facility(BaseModel):
    id: str
    name: str
    facility_type: FacilityType
    village_or_block: str
    contact_phone: str
    emergency_capability: bool
    oxygen_available: bool
    icu_beds_available: bool
    specialists_available: List[str]
    distance_km_demo: float
    est_travel_time_demo: str
    operating_hours: str
    is_demo_data: bool = True


class FollowUpCreate(BaseModel):
    referral_id: Optional[str] = None
    patient_id: str
    due_date: str
    follow_up_reason: str
    notes: Optional[str] = None


class FollowUp(BaseModel):
    id: str
    referral_id: Optional[str]
    patient_id: str
    patient_name: str
    patient_village: str
    due_date: str
    status: FollowUpStatus
    follow_up_reason: str
    notes: Optional[str]
    created_at: str
    completed_at: Optional[str] = None


class FollowUpUpdate(BaseModel):
    status: Optional[FollowUpStatus] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None


class DashboardStats(BaseModel):
    patients_assessed_today: int
    high_risk_assessments: int
    referrals_pending: int
    followups_due: int
    missed_followups: int
    sync_status: str
    last_sync_timestamp: str
    urgency_distribution: Dict[str, int]
    recent_assessments: List[Dict[str, Any]]
    recent_referrals: List[Dict[str, Any]]
    pending_followups_list: List[Dict[str, Any]]
