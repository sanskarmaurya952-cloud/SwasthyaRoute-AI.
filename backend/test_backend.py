"""Unit and Integration Tests for SwasthyaRoute AI Backend."""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.models import AssessmentInput, VitalsInput, PatientBase, RiskCategory, UrgencyLevel
from backend.triage_engine import evaluate_triage
from backend.database import reset_database_to_seed

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    reset_database_to_seed()


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "SwasthyaRoute AI" in data["service"]


def test_hackathon_demo_scenario_emergency_escalation():
    """Verify that Age 58, Breathlessness, Fever, SpO2 89% triggers HIGH risk and IMMEDIATE escalation."""
    payload = AssessmentInput(
        patient_info=PatientBase(
            demo_identifier="PAT-DEMO-TEST",
            full_name="Rameshwar Sharma",
            age=58,
            village="Rampur",
            existing_conditions=["Hypertension"]
        ),
        symptoms=["Breathlessness", "Fever"],
        symptom_duration="2 days",
        vitals=VitalsInput(
            heart_rate=112,
            spo2=89.0,
            temperature=101.4,
            respiratory_rate=28
        ),
        voice_transcript="Patient ko saans lene mein dikkat hai aur fever hai."
    )

    result = evaluate_triage(payload, patient_name="Rameshwar Sharma", patient_age=58, patient_village="Rampur")

    assert result.risk_category == RiskCategory.HIGH
    assert result.urgency == UrgencyLevel.EMERGENCY_IMMEDIATE
    assert result.is_demo_case is True
    
    # Check that Critical SpO2 rule was triggered
    rule_ids = [r.rule_id for r in result.triggered_rules]
    assert "RF-SPO2-CRITICAL" in rule_ids
    assert "RF-RESP-SPO2-SYNERGY" in rule_ids
    
    # Check feature contribution
    spo2_contrib = next((f for f in result.feature_contributions if "SpO2" in f.feature_name), None)
    assert spo2_contrib is not None
    assert spo2_contrib.risk_impact == "HIGH_RISK_TRIGGER"


def test_normal_patient_low_risk():
    """Verify that normal vitals with mild symptoms result in LOW risk."""
    payload = AssessmentInput(
        symptoms=["Mild headache"],
        vitals=VitalsInput(
            heart_rate=72,
            spo2=99.0,
            temperature=98.6,
            respiratory_rate=16
        )
    )
    result = evaluate_triage(payload, patient_name="Test Healthy", patient_age=30, patient_village="Chandanpur")
    assert result.risk_category == RiskCategory.LOW
    assert result.urgency == UrgencyLevel.ROUTINE_SCHEDULED
    assert len(result.triggered_rules) == 0


def test_create_and_update_referral():
    """Test creating a referral from assessment and updating its status."""
    # First get an assessment
    assessments_res = client.get("/api/assessments")
    assert assessments_res.status_code == 200
    assessments = assessments_res.json()
    assert len(assessments) > 0
    target_assess = assessments[0]

    # Create referral
    ref_payload = {
        "assessment_id": target_assess["id"],
        "patient_id": target_assess["patient_id"],
        "destination_facility_id": "FAC-DH-01",
        "reason": "Severe hypoxia needing oxygen",
        "urgency": "EMERGENCY_IMMEDIATE",
        "notes": "Ambulance dispatched"
    }
    create_res = client.post("/api/referrals", json=ref_payload)
    assert create_res.status_code == 201
    created_ref = create_res.json()
    assert created_ref["status"] == "Approved"
    assert created_ref["destination_facility_id"] == "FAC-DH-01"

    # Update referral status to In Transit
    update_res = client.patch(
        f"/api/referrals/{created_ref['id']}",
        json={"status": "In Transit", "notes": "Ambulance en route with patient"}
    )
    assert update_res.status_code == 200
    updated_ref = update_res.json()
    assert updated_ref["status"] == "In Transit"
    assert len(updated_ref["status_history"]) >= 3


def test_followup_lifecycle():
    """Test follow-up listing, creation, and status completion."""
    # List followups
    fol_res = client.get("/api/followups")
    assert fol_res.status_code == 200
    followups = fol_res.json()
    assert len(followups) > 0

    # Pick the first due follow-up
    due_fol = next((f for f in followups if f["status"] == "Due"), None)
    assert due_fol is not None

    # Complete it
    patch_res = client.patch(
        f"/api/followups/{due_fol['id']}",
        json={"status": "Completed", "notes": "Completed home checkup. Patient vitals stable."}
    )
    assert patch_res.status_code == 200
    completed_fol = patch_res.json()
    assert completed_fol["status"] == "Completed"
    assert completed_fol["completed_at"] is not None


def test_dashboard_metrics_dynamic_update():
    """Verify dashboard metrics are computed dynamically from data."""
    initial_stats = client.get("/api/dashboard").json()
    initial_assessed = initial_stats["patients_assessed_today"]

    # Create new assessment
    new_assess_payload = {
        "patient_info": {
            "demo_identifier": "PAT-TEST-999",
            "full_name": "Test Dynamic Patient",
            "age": 45,
            "village": "Rampur",
            "existing_conditions": []
        },
        "symptoms": ["Fever"],
        "vitals": {"temperature": 100.2, "spo2": 96.0}
    }
    client.post("/api/assessments", json=new_assess_payload)

    updated_stats = client.get("/api/dashboard").json()
    assert updated_stats["patients_assessed_today"] == initial_assessed + 1
