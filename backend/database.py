"""Database and seed data store for SwasthyaRoute AI."""

import json
import os
import sqlite3
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import uuid

from .models import (
    Patient,
    AssessmentResult,
    Referral,
    Facility,
    FollowUp,
    DashboardStats,
    RiskCategory,
    UrgencyLevel,
    ReferralStatus,
    FollowUpStatus,
    FacilityType,
)

DB_PATH = os.path.join(os.path.dirname(__file__), "swasthya_route.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        demo_identifier TEXT NOT NULL,
        full_name TEXT NOT NULL,
        age INTEGER NOT NULL,
        sex TEXT,
        village TEXT NOT NULL,
        phone_number TEXT,
        existing_conditions TEXT,
        pregnancy_status INTEGER DEFAULT 0,
        notes TEXT,
        created_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS assessments (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        patient_age INTEGER NOT NULL,
        patient_village TEXT NOT NULL,
        symptoms TEXT NOT NULL,
        symptom_duration TEXT,
        vitals TEXT NOT NULL,
        voice_transcript TEXT,
        risk_category TEXT NOT NULL,
        urgency TEXT NOT NULL,
        score INTEGER NOT NULL,
        triggered_rules TEXT NOT NULL,
        feature_contributions TEXT NOT NULL,
        recommended_care_level TEXT NOT NULL,
        recommended_action TEXT NOT NULL,
        facility_options TEXT,
        human_review_status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        is_demo_case INTEGER DEFAULT 0,
        disclaimer TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS referrals (
        id TEXT PRIMARY KEY,
        assessment_id TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        patient_age INTEGER NOT NULL,
        patient_village TEXT NOT NULL,
        destination_facility_id TEXT NOT NULL,
        destination_facility_name TEXT NOT NULL,
        destination_facility_type TEXT NOT NULL,
        risk_category TEXT NOT NULL,
        urgency TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL,
        status_history TEXT NOT NULL,
        created_at TEXT NOT NULL,
        reviewed_by TEXT,
        transport_mode TEXT,
        notes TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS facilities (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        facility_type TEXT NOT NULL,
        village_or_block TEXT NOT NULL,
        contact_phone TEXT NOT NULL,
        emergency_capability INTEGER NOT NULL,
        oxygen_available INTEGER NOT NULL,
        icu_beds_available INTEGER NOT NULL,
        specialists_available TEXT NOT NULL,
        distance_km_demo REAL NOT NULL,
        est_travel_time_demo TEXT NOT NULL,
        operating_hours TEXT NOT NULL,
        is_demo_data INTEGER DEFAULT 1
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS followups (
        id TEXT PRIMARY KEY,
        referral_id TEXT,
        patient_id TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        patient_village TEXT NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT NOT NULL,
        follow_up_reason TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT
    )
    """)

    conn.commit()
    conn.close()

    # Seed if facilities are empty
    seed_if_empty()


def seed_if_empty():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as cnt FROM facilities")
    if cursor.fetchone()["cnt"] > 0:
        conn.close()
        return

    # Seed Facilities
    facilities_data = [
        (
            "FAC-DH-01",
            "District Hospital (DH) Civil Medical Center",
            FacilityType.DISTRICT_HOSPITAL.value,
            "District HQ (Civil Lines)",
            "+91 522 2390100 (Demo Helpline)",
            1,
            1,
            1,
            json.dumps(["General Medicine", "Pulmonology", "Cardiology", "Obstetrics & Gynaecology", "Emergency Trauma"]),
            14.2,
            "25-30 mins",
            "24x7 Emergency & Inpatient",
            1
        ),
        (
            "FAC-CHC-02",
            "Community Health Centre (CHC) Rampur",
            FacilityType.CHC.value,
            "Rampur Block Center",
            "+91 522 2490200 (Demo Desk)",
            1,
            1,
            0,
            json.dumps(["General Physician", "Paediatrician", "Gynaecologist", "24/7 Delivery Room"]),
            6.5,
            "12-15 mins",
            "24x7 Emergency Stabilisation & 30-Bed Inpatient",
            1
        ),
        (
            "FAC-PHC-03",
            "Primary Health Centre (PHC) Chandanpur",
            FacilityType.PHC.value,
            "Chandanpur Village",
            "+91 522 2590300 (Demo PHC)",
            0,
            0,
            0,
            json.dumps(["Medical Officer (MBBS)", "Staff Nurse", "Pharmacist"]),
            2.8,
            "6-8 mins",
            "9:00 AM - 4:00 PM (OPD)",
            1
        ),
        (
            "FAC-SHC-04",
            "Sub-Health Centre (SHC) Kalyanpur",
            FacilityType.SUB_CENTRE.value,
            "Kalyanpur Sector 2",
            "+91 522 2690400 (Demo ANM)",
            0,
            0,
            0,
            json.dumps(["ANM (Auxiliary Nurse Midwife)", "Community Health Officer (CHO)"]),
            1.2,
            "3-5 mins",
            "9:00 AM - 2:00 PM (ANC / Immunization / NCD)",
            1
        ),
        (
            "FAC-MED-05",
            "Regional Institute of Medical Sciences (Tertiary/Super-Specialty)",
            FacilityType.TERTIARY_MEDICAL_COLLEGE.value,
            "State Capital Corridor",
            "+91 522 2790500 (Demo Trauma)",
            1,
            1,
            1,
            json.dumps(["Advanced Respiratory ICU", "Cardiac Cath Lab", "Neonatal Intensive Care", "Neurosurgery"]),
            38.5,
            "50-60 mins",
            "24x7 Tertiary Emergency & Super-Specialty",
            1
        )
    ]

    cursor.executemany("""
    INSERT INTO facilities (
        id, name, facility_type, village_or_block, contact_phone,
        emergency_capability, oxygen_available, icu_beds_available,
        specialists_available, distance_km_demo, est_travel_time_demo,
        operating_hours, is_demo_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, facilities_data)

    # Seed demo patients
    today_str = datetime.now().strftime("%Y-%m-%d")
    yesterday_str = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    patients_data = [
        (
            "PAT-DEMO-001",
            "PAT-2026-001",
            "Rameshwar Sharma",
            58,
            "Male",
            "Rampur Kalan",
            "+91 98765 43210",
            json.dumps(["Hypertension", "Smoker"]),
            0,
            "Reported severe sudden breathlessness with fever for 2 days.",
            datetime.now().isoformat()
        ),
        (
            "PAT-DEMO-002",
            "PAT-2026-002",
            "Shanti Devi",
            42,
            "Female",
            "Chandanpur",
            "+91 98765 43211",
            json.dumps(["Type 2 Diabetes"]),
            0,
            "Routine seasonal cold and mild body ache.",
            (datetime.now() - timedelta(hours=3)).isoformat()
        ),
        (
            "PAT-DEMO-003",
            "PAT-2026-003",
            "Pooja Kumari",
            24,
            "Female",
            "Kalyanpur",
            "+91 98765 43212",
            json.dumps([]),
            1,
            "Third trimester ANC checkup; elevated BP noted at SHC.",
            yesterday_str + "T10:30:00"
        ),
        (
            "PAT-DEMO-004",
            "PAT-2026-004",
            "Mohammad Arif",
            67,
            "Male",
            "Rampur Block",
            "+91 98765 43213",
            json.dumps(["COPD", "Coronary Artery Disease"]),
            0,
            "Chronic cough with yellow sputum, needs CHC review.",
            yesterday_str + "T14:15:00"
        ),
    ]

    cursor.executemany("""
    INSERT INTO patients (
        id, demo_identifier, full_name, age, sex, village, phone_number,
        existing_conditions, pregnancy_status, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, patients_data)

    # Seed assessments
    assessments_data = [
        (
            "ASSESS-20261009-DEMO01",
            "PAT-DEMO-001",
            "Rameshwar Sharma",
            58,
            "Rampur Kalan",
            json.dumps(["Breathlessness", "Fever", "Cough"]),
            "2 days",
            json.dumps({"heart_rate": 112, "spo2": 89.0, "temperature": 101.4, "respiratory_rate": 28, "systolic_bp": 142, "diastolic_bp": 88}),
            "Patient ko saans lene mein dikkat hai aur fever hai.",
            RiskCategory.HIGH.value,
            UrgencyLevel.EMERGENCY_IMMEDIATE.value,
            85,
            json.dumps([
                {
                    "rule_id": "RF-SPO2-CRITICAL",
                    "rule_name": "Critical Hypoxemia (SpO2 < 90%)",
                    "severity": "CRITICAL",
                    "clinical_rationale": "Measured SpO2 is 89.0%, critically below 95%. Immediate supplemental oxygen required.",
                    "suggested_level": "District Hospital (DH)"
                },
                {
                    "rule_id": "RF-RESP-SPO2-SYNERGY",
                    "rule_name": "Combined Breathlessness with Low SpO2",
                    "severity": "CRITICAL",
                    "clinical_rationale": "Acute shortness of breath paired with sub-90% SpO2 indicates acute respiratory failure.",
                    "suggested_level": "District Hospital (DH) / CHC Emergency"
                },
                {
                    "rule_id": "RF-SYNERGY-FEVER-BREATH",
                    "rule_name": "Dual Triad: Fever + Breathlessness",
                    "severity": "CRITICAL",
                    "clinical_rationale": "Fever with dyspnea suggests acute lower respiratory tract infection / pneumonia.",
                    "suggested_level": "CHC or District Hospital"
                }
            ]),
            json.dumps([
                {"feature_name": "Oxygen Saturation (SpO2)", "value": "89.0%", "risk_impact": "HIGH_RISK_TRIGGER", "points_weight": 50, "note": "Severe hypoxia."},
                {"feature_name": "Reported Breathlessness", "value": "Yes (Active)", "risk_impact": "HIGH_RISK_TRIGGER", "points_weight": 25, "note": "Respiratory fatigue."},
                {"feature_name": "Body Temperature", "value": "101.4°F", "risk_impact": "MODERATE_RISK", "points_weight": 10, "note": "Active fever."}
            ]),
            FacilityType.DISTRICT_HOSPITAL.value,
            "🚨 IMMEDIATE ESCALATION REQUIRED: Patient exhibits critical hypoxemia (89%). Call 108 ambulance immediately.",
            json.dumps([
                {"id": "FAC-DH-01", "name": "District Hospital (DH) Civil Medical Center", "facility_type": "District Hospital (DH)", "distance_km": 14.2, "est_time": "25-30 mins", "emergency_ready": True, "oxygen_supported": True, "match_reason": "Equipped with 24/7 ICU and oxygen manifold."}
            ]),
            "Pending ASHA Confirmation",
            datetime.now().isoformat(),
            1,
            "Prototype clinical decision support. Not certified for autonomous diagnosis."
        ),
        (
            "ASSESS-20261009-DEMO02",
            "PAT-DEMO-002",
            "Shanti Devi",
            42,
            "Chandanpur",
            json.dumps(["Mild headache", "Body ache"]),
            "1 day",
            json.dumps({"heart_rate": 78, "spo2": 98.0, "temperature": 98.6, "respiratory_rate": 18, "systolic_bp": 124, "diastolic_bp": 78}),
            "Patient bol rahi hain halka sar dard hai.",
            RiskCategory.LOW.value,
            UrgencyLevel.ROUTINE_SCHEDULED.value,
            5,
            json.dumps([]),
            json.dumps([
                {"feature_name": "Oxygen Saturation (SpO2)", "value": "98.0%", "risk_impact": "NORMAL", "points_weight": 0, "note": "Healthy baseline."},
                {"feature_name": "Heart Rate", "value": "78 bpm", "risk_impact": "NORMAL", "points_weight": 0, "note": "Normal resting rate."}
            ]),
            FacilityType.PHC.value,
            "✅ ROUTINE / PRIMARY CARE: Routine care and home hydration advice. Sub-centre follow-up in 3 days.",
            json.dumps([]),
            "ASHA Verified",
            (datetime.now() - timedelta(hours=3)).isoformat(),
            0,
            "Prototype clinical decision support."
        ),
        (
            "ASSESS-20261008-DEMO03",
            "PAT-DEMO-003",
            "Pooja Kumari",
            24,
            "Kalyanpur",
            json.dumps(["Mild swelling in feet", "Slight dizziness"]),
            "3 days",
            json.dumps({"heart_rate": 88, "spo2": 97.0, "temperature": 98.4, "respiratory_rate": 20, "systolic_bp": 146, "diastolic_bp": 94}),
            "Garbhavati mahila hain, pairon mein sujan hai.",
            RiskCategory.MODERATE.value,
            UrgencyLevel.URGENT_SAME_DAY.value,
            35,
            json.dumps([
                {
                    "rule_id": "RF-ANC-GESTATIONAL-BP",
                    "rule_name": "Gestational Hypertension Warning",
                    "severity": "WARNING",
                    "clinical_rationale": "Elevated BP (146/94) in pregnant woman requires same-day obstetrician evaluation for pre-eclampsia.",
                    "suggested_level": "Community Health Centre (CHC)"
                }
            ]),
            json.dumps([
                {"feature_name": "Blood Pressure", "value": "146/94 mmHg", "risk_impact": "MODERATE_RISK", "points_weight": 25, "note": "High for pregnancy trimester."}
            ]),
            FacilityType.CHC.value,
            "⚠️ SAME-DAY CLINICAL EVALUATION: Obstetric screening at CHC Rampur today for pre-eclampsia workup.",
            json.dumps([]),
            "ASHA Verified",
            yesterday_str + "T10:45:00",
            0,
            "Prototype clinical decision support."
        ),
    ]

    cursor.executemany("""
    INSERT INTO assessments (
        id, patient_id, patient_name, patient_age, patient_village, symptoms,
        symptom_duration, vitals, voice_transcript, risk_category, urgency,
        score, triggered_rules, feature_contributions, recommended_care_level,
        recommended_action, facility_options, human_review_status, created_at,
        is_demo_case, disclaimer
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, assessments_data)

    # Seed referrals
    referrals_data = [
        (
            "REF-2026-001",
            "ASSESS-20261009-DEMO01",
            "PAT-DEMO-001",
            "Rameshwar Sharma",
            58,
            "Rampur Kalan",
            "FAC-DH-01",
            "District Hospital (DH) Civil Medical Center",
            "District Hospital (DH)",
            RiskCategory.HIGH.value,
            UrgencyLevel.EMERGENCY_IMMEDIATE.value,
            "Severe Hypoxia (SpO2 89%) with Acute Breathlessness and Fever",
            ReferralStatus.IN_TRANSIT.value,
            json.dumps([
                {"status": "Pending Review", "timestamp": (datetime.now() - timedelta(minutes=45)).isoformat(), "by": "System Assessment"},
                {"status": "Approved", "timestamp": (datetime.now() - timedelta(minutes=35)).isoformat(), "by": "ASHA Worker Sunita Devi"},
                {"status": "In Transit", "timestamp": (datetime.now() - timedelta(minutes=15)).isoformat(), "by": "108 Ambulance Unit #14"}
            ]),
            datetime.now().isoformat(),
            "Demo ASHA Worker (Sunita Devi)",
            "108 Emergency Ambulance (Dispatched)",
            "Oxygen cylinder requested on-board. MO notified at District Hospital."
        ),
        (
            "REF-2026-002",
            "ASSESS-20261008-DEMO03",
            "PAT-DEMO-003",
            "Pooja Kumari",
            24,
            "Kalyanpur",
            "FAC-CHC-02",
            "Community Health Centre (CHC) Rampur",
            "Community Health Centre (CHC)",
            RiskCategory.MODERATE.value,
            UrgencyLevel.URGENT_SAME_DAY.value,
            "Gestational hypertension screening (BP 146/94 mmHg)",
            ReferralStatus.VISIT_COMPLETED.value,
            json.dumps([
                {"status": "Pending Review", "timestamp": yesterday_str + "T11:00:00", "by": "System"},
                {"status": "Approved", "timestamp": yesterday_str + "T11:15:00", "by": "ASHA Worker Sunita Devi"},
                {"status": "Visit Completed", "timestamp": yesterday_str + "T15:30:00", "by": "Dr. Verma (CHC Medical Officer)"}
            ]),
            yesterday_str + "T11:00:00",
            "Demo ASHA Worker (Sunita Devi)",
            "Community Auto-Rickshaw",
            "Doctor prescribed Methyldopa and scheduled weekly protein urine tests."
        )
    ]

    cursor.executemany("""
    INSERT INTO referrals (
        id, assessment_id, patient_id, patient_name, patient_age, patient_village,
        destination_facility_id, destination_facility_name, destination_facility_type,
        risk_category, urgency, reason, status, status_history, created_at,
        reviewed_by, transport_mode, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, referrals_data)

    # Seed followups
    tomorrow_str = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    overdue_str = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")

    followups_data = [
        (
            "FOL-2026-001",
            "REF-2026-001",
            "PAT-DEMO-001",
            "Rameshwar Sharma",
            "Rampur Kalan",
            tomorrow_str,
            FollowUpStatus.DUE.value,
            "Verify post-admission oxygen stabilization and discharge summary from District Hospital.",
            "Family notified. ASHA home visit scheduled for tomorrow morning.",
            datetime.now().isoformat(),
            None
        ),
        (
            "FOL-2026-002",
            "REF-2026-002",
            "PAT-DEMO-003",
            "Pooja Kumari",
            "Kalyanpur",
            today_str,
            FollowUpStatus.DUE.value,
            "Check daily BP compliance and adherence to prescribed antihypertensive tablets.",
            "Patient taking medication properly; check BP again at Sub-centre.",
            yesterday_str + "T16:00:00",
            None
        ),
        (
            "FOL-2026-003",
            None,
            "PAT-DEMO-004",
            "Mohammad Arif",
            "Rampur Block",
            overdue_str,
            FollowUpStatus.MISSED.value,
            "Monthly COPD inhaler compliance check.",
            "Patient was traveling to relative's house during scheduled visit.",
            overdue_str + "T09:00:00",
            None
        ),
        (
            "FOL-2026-004",
            None,
            "PAT-DEMO-002",
            "Shanti Devi",
            "Chandanpur",
            yesterday_str,
            FollowUpStatus.COMPLETED.value,
            "Check recovery from seasonal headache/malaise.",
            "Patient fully recovered, vitals checked normal at home visit.",
            yesterday_str + "T08:00:00",
            yesterday_str + "T17:00:00"
        ),
    ]

    cursor.executemany("""
    INSERT INTO followups (
        id, referral_id, patient_id, patient_name, patient_village, due_date,
        status, follow_up_reason, notes, created_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, followups_data)

    conn.commit()
    conn.close()


def get_dashboard_stats() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()

    today_str = datetime.now().strftime("%Y-%m-%d")

    cursor.execute("SELECT COUNT(*) as cnt FROM assessments WHERE created_at LIKE ?", (f"{today_str}%",))
    assessed_today = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM assessments WHERE risk_category = 'HIGH'")
    high_risk_count = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM referrals WHERE status IN ('Pending Review', 'Approved', 'In Transit')")
    referrals_pending = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM followups WHERE status = 'Due'")
    followups_due = cursor.fetchone()["cnt"]

    cursor.execute("SELECT COUNT(*) as cnt FROM followups WHERE status = 'Missed'")
    missed_followups = cursor.fetchone()["cnt"]

    # Urgency distribution
    cursor.execute("SELECT urgency, COUNT(*) as cnt FROM assessments GROUP BY urgency")
    urgency_rows = cursor.fetchall()
    urgency_distribution = {
        UrgencyLevel.EMERGENCY_IMMEDIATE.value: 0,
        UrgencyLevel.URGENT_SAME_DAY.value: 0,
        UrgencyLevel.ROUTINE_SCHEDULED.value: 0,
        UrgencyLevel.HOME_CARE_MONITORING.value: 0,
    }
    for row in urgency_rows:
        urgency_distribution[row["urgency"]] = row["cnt"]

    # Recent assessments
    cursor.execute("SELECT * FROM assessments ORDER BY created_at DESC LIMIT 5")
    recent_assessments = []
    for row in cursor.fetchall():
        item = dict(row)
        item["symptoms"] = json.loads(item["symptoms"])
        item["vitals"] = json.loads(item["vitals"])
        item["triggered_rules"] = json.loads(item["triggered_rules"])
        item["feature_contributions"] = json.loads(item["feature_contributions"])
        recent_assessments.append(item)

    # Recent referrals
    cursor.execute("SELECT * FROM referrals ORDER BY created_at DESC LIMIT 5")
    recent_referrals = []
    for row in cursor.fetchall():
        item = dict(row)
        item["status_history"] = json.loads(item["status_history"])
        recent_referrals.append(item)

    # Pending followups
    cursor.execute("SELECT * FROM followups WHERE status = 'Due' ORDER BY due_date ASC LIMIT 5")
    pending_followups = [dict(r) for r in cursor.fetchall()]

    conn.close()

    return {
        "patients_assessed_today": assessed_today,
        "high_risk_assessments": high_risk_count,
        "referrals_pending": referrals_pending,
        "followups_due": followups_due,
        "missed_followups": missed_followups,
        "sync_status": "Online (Synchronized)",
        "last_sync_timestamp": datetime.now().isoformat(),
        "urgency_distribution": urgency_distribution,
        "recent_assessments": recent_assessments,
        "recent_referrals": recent_referrals,
        "pending_followups_list": pending_followups,
    }


def reset_database_to_seed():
    """Reset the database with initial demo data."""
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    init_db()
