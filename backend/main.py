"""FastAPI application for SwasthyaRoute AI."""

import json
import os
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .models import (
    Patient,
    PatientCreate,
    AssessmentInput,
    AssessmentResult,
    Referral,
    ReferralCreate,
    ReferralUpdate,
    Facility,
    FollowUp,
    FollowUpCreate,
    FollowUpUpdate,
    DashboardStats,
    ReferralStatus,
    FollowUpStatus,
    UrgencyLevel,
)
from .database import (
    init_db,
    get_connection,
    get_dashboard_stats,
    reset_database_to_seed,
)
from .triage_engine import evaluate_triage

# Initialize Database
init_db()

app = FastAPI(
    title="SwasthyaRoute AI Backend",
    description="Offline-first, voice-enabled AI triage and referral decision support API for frontline healthcare workers.",
    version="1.0.0",
)

# Enable CORS for local Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Hackathon demo safe local origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "service": "SwasthyaRoute AI Core Engine",
        "mode": "Demonstration / Clinical Decision Support",
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/dashboard", response_model=DashboardStats)
def get_dashboard():
    """Retrieve aggregate metrics and recent activities for the ASHA worker dashboard."""
    return get_dashboard_stats()


@app.get("/api/patients", response_model=List[Patient])
def list_patients():
    """List all registered demo patients."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patients ORDER BY created_at DESC")
    rows = cursor.fetchall()
    patients = []
    for r in rows:
        d = dict(r)
        d["existing_conditions"] = json.loads(d["existing_conditions"]) if d["existing_conditions"] else []
        patients.append(d)
    conn.close()
    return patients


@app.post("/api/patients", response_model=Patient, status_code=status.HTTP_201_CREATED)
def create_patient(payload: PatientCreate):
    """Create a new demo patient record."""
    patient_id = f"PAT-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"
    created_at = datetime.now().isoformat()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO patients (
        id, demo_identifier, full_name, age, sex, village, phone_number,
        existing_conditions, pregnancy_status, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        patient_id,
        payload.demo_identifier,
        payload.full_name,
        payload.age,
        payload.sex,
        payload.village,
        payload.phone_number,
        json.dumps(payload.existing_conditions),
        1 if payload.pregnancy_status else 0,
        payload.notes,
        created_at,
    ))
    conn.commit()
    conn.close()

    return {
        "id": patient_id,
        **payload.model_dump(),
        "created_at": created_at,
    }


@app.post("/api/assessments/evaluate-only", response_model=AssessmentResult)
def evaluate_assessment_stateless(payload: AssessmentInput):
    """Run transparent triage rules statelessly without persisting."""
    p_name = payload.patient_info.full_name if payload.patient_info else "Demo Patient"
    p_age = payload.patient_info.age if payload.patient_info else 58
    p_village = payload.patient_info.village if payload.patient_info else "Rampur Block"
    return evaluate_triage(
        payload,
        patient_name=p_name,
        patient_age=p_age,
        patient_village=p_village,
        patient_id=payload.patient_id,
    )


@app.post("/api/assessments", response_model=AssessmentResult, status_code=status.HTTP_201_CREATED)
def create_assessment(payload: AssessmentInput):
    """Execute clinical triage evaluation and persist the resulting assessment."""
    conn = get_connection()
    cursor = conn.cursor()

    # Determine or create patient
    patient_id = payload.patient_id
    patient_name = "Demo Patient"
    patient_age = 58
    patient_village = "Rampur Block"

    if payload.patient_info:
        if not patient_id:
            patient_id = f"PAT-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:4].upper()}"
            cursor.execute("""
            INSERT INTO patients (
                id, demo_identifier, full_name, age, sex, village, phone_number,
                existing_conditions, pregnancy_status, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                patient_id,
                payload.patient_info.demo_identifier,
                payload.patient_info.full_name,
                payload.patient_info.age,
                payload.patient_info.sex,
                payload.patient_info.village,
                payload.patient_info.phone_number,
                json.dumps(payload.patient_info.existing_conditions),
                1 if payload.patient_info.pregnancy_status else 0,
                payload.patient_info.notes,
                datetime.now().isoformat(),
            ))
        patient_name = payload.patient_info.full_name
        patient_age = payload.patient_info.age
        patient_village = payload.patient_info.village
    elif patient_id:
        cursor.execute("SELECT * FROM patients WHERE id = ?", (patient_id,))
        p_row = cursor.fetchone()
        if p_row:
            patient_name = p_row["full_name"]
            patient_age = p_row["age"]
            patient_village = p_row["village"]

    # Run clinical triage engine
    result = evaluate_triage(
        payload,
        patient_name=patient_name,
        patient_age=patient_age,
        patient_village=patient_village,
        patient_id=patient_id,
    )

    cursor.execute("""
    INSERT INTO assessments (
        id, patient_id, patient_name, patient_age, patient_village, symptoms,
        symptom_duration, vitals, voice_transcript, risk_category, urgency,
        score, triggered_rules, feature_contributions, recommended_care_level,
        recommended_action, facility_options, human_review_status, created_at,
        is_demo_case, disclaimer
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        result.id,
        result.patient_id,
        result.patient_name,
        result.patient_age,
        result.patient_village,
        json.dumps(result.symptoms),
        result.symptom_duration,
        json.dumps(result.vitals.model_dump()),
        result.voice_transcript,
        result.risk_category.value,
        result.urgency.value,
        result.score,
        json.dumps([r.model_dump() for r in result.triggered_rules]),
        json.dumps([f.model_dump() for f in result.feature_contributions]),
        result.recommended_care_level.value,
        result.recommended_action,
        json.dumps(result.facility_options),
        result.human_review_status,
        result.created_at,
        1 if result.is_demo_case else 0,
        result.disclaimer,
    ))

    conn.commit()
    conn.close()

    return result


@app.get("/api/assessments", response_model=List[AssessmentResult])
def list_assessments():
    """List historical patient assessments."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM assessments ORDER BY created_at DESC")
    rows = cursor.fetchall()
    results = []
    for r in rows:
        d = dict(r)
        d["symptoms"] = json.loads(d["symptoms"])
        d["vitals"] = json.loads(d["vitals"])
        d["triggered_rules"] = json.loads(d["triggered_rules"])
        d["feature_contributions"] = json.loads(d["feature_contributions"])
        d["facility_options"] = json.loads(d["facility_options"]) if d["facility_options"] else []
        d["is_demo_case"] = bool(d["is_demo_case"])
        results.append(d)
    conn.close()
    return results


@app.get("/api/assessments/{assessment_id}", response_model=AssessmentResult)
def get_assessment(assessment_id: str):
    """Retrieve single assessment details."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM assessments WHERE id = ?", (assessment_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail=f"Assessment {assessment_id} not found")
    d = dict(row)
    d["symptoms"] = json.loads(d["symptoms"])
    d["vitals"] = json.loads(d["vitals"])
    d["triggered_rules"] = json.loads(d["triggered_rules"])
    d["feature_contributions"] = json.loads(d["feature_contributions"])
    d["facility_options"] = json.loads(d["facility_options"]) if d["facility_options"] else []
    d["is_demo_case"] = bool(d["is_demo_case"])
    return d


@app.get("/api/facilities", response_model=List[Facility])
def list_facilities(facility_type: Optional[str] = None):
    """List registered demonstration healthcare facilities with filtering."""
    conn = get_connection()
    cursor = conn.cursor()
    if facility_type:
        cursor.execute("SELECT * FROM facilities WHERE facility_type LIKE ? ORDER BY distance_km_demo ASC", (f"%{facility_type}%",))
    else:
        cursor.execute("SELECT * FROM facilities ORDER BY distance_km_demo ASC")
    rows = cursor.fetchall()
    facilities = []
    for r in rows:
        d = dict(r)
        d["emergency_capability"] = bool(d["emergency_capability"])
        d["oxygen_available"] = bool(d["oxygen_available"])
        d["icu_beds_available"] = bool(d["icu_beds_available"])
        d["specialists_available"] = json.loads(d["specialists_available"])
        d["is_demo_data"] = bool(d["is_demo_data"])
        facilities.append(d)
    conn.close()
    return facilities


@app.post("/api/referrals", response_model=Referral, status_code=status.HTTP_201_CREATED)
def create_referral(payload: ReferralCreate):
    """Create a new patient referral linked to an assessment."""
    conn = get_connection()
    cursor = conn.cursor()

    # Retrieve assessment details
    cursor.execute("SELECT * FROM assessments WHERE id = ?", (payload.assessment_id,))
    assess_row = cursor.fetchone()
    if not assess_row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Assessment {payload.assessment_id} not found")

    # Retrieve facility details
    cursor.execute("SELECT * FROM facilities WHERE id = ?", (payload.destination_facility_id,))
    fac_row = cursor.fetchone()
    fac_name = fac_row["name"] if fac_row else "Selected Medical Facility"
    fac_type = fac_row["facility_type"] if fac_row else "District Hospital"

    referral_id = f"REF-{datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:4].upper()}"
    created_at = datetime.now().isoformat()
    status_history = [
        {"status": ReferralStatus.PENDING_REVIEW.value, "timestamp": created_at, "by": "System Assessment"},
        {"status": ReferralStatus.APPROVED.value, "timestamp": created_at, "by": "ASHA Worker (Sunita Devi)"}
    ]

    cursor.execute("""
    INSERT INTO referrals (
        id, assessment_id, patient_id, patient_name, patient_age, patient_village,
        destination_facility_id, destination_facility_name, destination_facility_type,
        risk_category, urgency, reason, status, status_history, created_at,
        reviewed_by, transport_mode, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        referral_id,
        payload.assessment_id,
        assess_row["patient_id"],
        assess_row["patient_name"],
        assess_row["patient_age"],
        assess_row["patient_village"],
        payload.destination_facility_id,
        fac_name,
        fac_type,
        assess_row["risk_category"],
        payload.urgency.value,
        payload.reason,
        ReferralStatus.APPROVED.value,
        json.dumps(status_history),
        created_at,
        "Demo ASHA Worker (Sunita Devi)",
        "108 Emergency Ambulance Requested" if assess_row["risk_category"] == "HIGH" else "Local Transport",
        payload.notes,
    ))

    # Also automatically schedule a follow-up for this referral
    followup_id = f"FOL-{datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:4].upper()}"
    cursor.execute("""
    INSERT INTO followups (
        id, referral_id, patient_id, patient_name, patient_village, due_date,
        status, follow_up_reason, notes, created_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        followup_id,
        referral_id,
        assess_row["patient_id"],
        assess_row["patient_name"],
        assess_row["patient_village"],
        datetime.now().strftime("%Y-%m-%d"),
        FollowUpStatus.DUE.value,
        f"Post-referral checkup for {assess_row['patient_name']}: {payload.reason[:60]}",
        f"Auto-generated for referral {referral_id}. Confirm facility arrival and treatment plan.",
        created_at,
        None,
    ))

    conn.commit()

    cursor.execute("SELECT * FROM referrals WHERE id = ?", (referral_id,))
    new_ref = dict(cursor.fetchone())
    new_ref["status_history"] = json.loads(new_ref["status_history"])
    conn.close()

    return new_ref


@app.get("/api/referrals", response_model=List[Referral])
def list_referrals():
    """List all created referrals."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM referrals ORDER BY created_at DESC")
    rows = cursor.fetchall()
    referrals = []
    for r in rows:
        d = dict(r)
        d["status_history"] = json.loads(d["status_history"])
        referrals.append(d)
    conn.close()
    return referrals


@app.patch("/api/referrals/{referral_id}", response_model=Referral)
def update_referral(referral_id: str, payload: ReferralUpdate):
    """Update referral state (e.g., In Transit, Visit Completed, Cancelled)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM referrals WHERE id = ?", (referral_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Referral {referral_id} not found")

    d = dict(row)
    status_history = json.loads(d["status_history"])

    new_status = payload.status.value if payload.status else d["status"]
    if payload.status and payload.status.value != d["status"]:
        status_history.append({
            "status": payload.status.value,
            "timestamp": datetime.now().isoformat(),
            "by": payload.reviewed_by or "Demo ASHA Worker (Sunita Devi)"
        })

    new_notes = payload.notes if payload.notes is not None else d["notes"]
    new_transport = payload.transport_mode if payload.transport_mode is not None else d["transport_mode"]
    new_reviewed_by = payload.reviewed_by if payload.reviewed_by is not None else d["reviewed_by"]

    cursor.execute("""
    UPDATE referrals
    SET status = ?, status_history = ?, notes = ?, transport_mode = ?, reviewed_by = ?
    WHERE id = ?
    """, (
        new_status,
        json.dumps(status_history),
        new_notes,
        new_transport,
        new_reviewed_by,
        referral_id,
    ))
    conn.commit()

    cursor.execute("SELECT * FROM referrals WHERE id = ?", (referral_id,))
    updated = dict(cursor.fetchone())
    updated["status_history"] = json.loads(updated["status_history"])
    conn.close()

    return updated


@app.get("/api/followups", response_model=List[FollowUp])
def list_followups(status_filter: Optional[str] = None):
    """List all follow-up tasks."""
    conn = get_connection()
    cursor = conn.cursor()
    if status_filter:
        cursor.execute("SELECT * FROM followups WHERE status = ? ORDER BY due_date ASC", (status_filter,))
    else:
        cursor.execute("SELECT * FROM followups ORDER BY due_date ASC")
    rows = cursor.fetchall()
    items = [dict(r) for r in rows]
    conn.close()
    return items


@app.post("/api/followups", response_model=FollowUp, status_code=status.HTTP_201_CREATED)
def create_followup(payload: FollowUpCreate):
    """Create a manual follow-up task."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM patients WHERE id = ?", (payload.patient_id,))
    p_row = cursor.fetchone()
    p_name = p_row["full_name"] if p_row else "Demo Patient"
    p_village = p_row["village"] if p_row else "Village Center"

    followup_id = f"FOL-{datetime.now().strftime('%Y')}-{uuid.uuid4().hex[:4].upper()}"
    created_at = datetime.now().isoformat()

    cursor.execute("""
    INSERT INTO followups (
        id, referral_id, patient_id, patient_name, patient_village, due_date,
        status, follow_up_reason, notes, created_at, completed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        followup_id,
        payload.referral_id,
        payload.patient_id,
        p_name,
        p_village,
        payload.due_date,
        FollowUpStatus.DUE.value,
        payload.follow_up_reason,
        payload.notes,
        created_at,
        None,
    ))
    conn.commit()

    cursor.execute("SELECT * FROM followups WHERE id = ?", (followup_id,))
    new_fol = dict(cursor.fetchone())
    conn.close()
    return new_fol


@app.patch("/api/followups/{followup_id}", response_model=FollowUp)
def update_followup(followup_id: str, payload: FollowUpUpdate):
    """Update follow-up status (e.g. Completed, Missed, Rescheduled)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM followups WHERE id = ?", (followup_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Follow-up {followup_id} not found")

    d = dict(row)
    new_status = payload.status.value if payload.status else d["status"]
    new_due_date = payload.due_date if payload.due_date else d["due_date"]
    new_notes = payload.notes if payload.notes is not None else d["notes"]
    completed_at = datetime.now().isoformat() if new_status == FollowUpStatus.COMPLETED.value else d["completed_at"]

    cursor.execute("""
    UPDATE followups
    SET status = ?, due_date = ?, notes = ?, completed_at = ?
    WHERE id = ?
    """, (
        new_status,
        new_due_date,
        new_notes,
        completed_at,
        followup_id,
    ))
    conn.commit()

    cursor.execute("SELECT * FROM followups WHERE id = ?", (followup_id,))
    updated = dict(cursor.fetchone())
    conn.close()
    return updated


class BatchSyncPayload(BaseModel):
    assessments: List[Dict[str, Any]] = []
    referrals: List[Dict[str, Any]] = []
    followups: List[Dict[str, Any]] = []


@app.post("/api/sync")
def sync_offline_records(payload: BatchSyncPayload):
    """Batch merge queued offline changes from browser IndexedDB."""
    conn = get_connection()
    cursor = conn.cursor()
    synced_assessments = 0
    synced_referrals = 0
    synced_followups = 0

    # Sync assessments
    for item in payload.assessments:
        try:
            cursor.execute("SELECT id FROM assessments WHERE id = ?", (item.get("id"),))
            if not cursor.fetchone():
                cursor.execute("""
                INSERT INTO assessments (
                    id, patient_id, patient_name, patient_age, patient_village, symptoms,
                    symptom_duration, vitals, voice_transcript, risk_category, urgency,
                    score, triggered_rules, feature_contributions, recommended_care_level,
                    recommended_action, facility_options, human_review_status, created_at,
                    is_demo_case, disclaimer
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    item.get("id"),
                    item.get("patient_id", "PAT-OFFLINE"),
                    item.get("patient_name", "Offline Patient"),
                    item.get("patient_age", 50),
                    item.get("patient_village", "Rural Sector"),
                    json.dumps(item.get("symptoms", [])),
                    item.get("symptom_duration", "1-2 days"),
                    json.dumps(item.get("vitals", {})),
                    item.get("voice_transcript"),
                    item.get("risk_category", "MODERATE"),
                    item.get("urgency", "URGENT_SAME_DAY"),
                    item.get("score", 30),
                    json.dumps(item.get("triggered_rules", [])),
                    json.dumps(item.get("feature_contributions", [])),
                    item.get("recommended_care_level", "CHC"),
                    item.get("recommended_action", "Evaluated offline."),
                    json.dumps(item.get("facility_options", [])),
                    item.get("human_review_status", "Synced from Offline"),
                    item.get("created_at", datetime.now().isoformat()),
                    1 if item.get("is_demo_case") else 0,
                    item.get("disclaimer", "Offline CDS assessment"),
                ))
                synced_assessments += 1
        except Exception as e:
            print(f"Error syncing assessment: {e}")

    # Sync referrals
    for item in payload.referrals:
        try:
            cursor.execute("SELECT id FROM referrals WHERE id = ?", (item.get("id"),))
            if not cursor.fetchone():
                cursor.execute("""
                INSERT INTO referrals (
                    id, assessment_id, patient_id, patient_name, patient_age, patient_village,
                    destination_facility_id, destination_facility_name, destination_facility_type,
                    risk_category, urgency, reason, status, status_history, created_at,
                    reviewed_by, transport_mode, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    item.get("id"),
                    item.get("assessment_id", ""),
                    item.get("patient_id", ""),
                    item.get("patient_name", "Offline Patient"),
                    item.get("patient_age", 50),
                    item.get("patient_village", "Rural Sector"),
                    item.get("destination_facility_id", "FAC-DH-01"),
                    item.get("destination_facility_name", "District Hospital"),
                    item.get("destination_facility_type", "District Hospital (DH)"),
                    item.get("risk_category", "HIGH"),
                    item.get("urgency", "EMERGENCY_IMMEDIATE"),
                    item.get("reason", "Offline Emergency Referral"),
                    item.get("status", "Approved"),
                    json.dumps(item.get("status_history", [])),
                    item.get("created_at", datetime.now().isoformat()),
                    item.get("reviewed_by", "Offline ASHA Queue"),
                    item.get("transport_mode", "108 Ambulance"),
                    item.get("notes", "Synced from offline storage"),
                ))
                synced_referrals += 1
        except Exception as e:
            print(f"Error syncing referral: {e}")

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "synced_assessments": synced_assessments,
        "synced_referrals": synced_referrals,
        "synced_followups": synced_followups,
        "server_timestamp": datetime.now().isoformat(),
    }


@app.post("/api/reset-demo")
def reset_demo_data():
    """Reset all tables back to standard demo state."""
    reset_database_to_seed()
    return {"status": "success", "message": "Demo data successfully reset to baseline."}
