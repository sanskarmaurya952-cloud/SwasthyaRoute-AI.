"""Transparent Clinical Risk Assessment & Triage Engine for SwasthyaRoute AI.

Adheres strictly to deterministic, explainable rule-based clinical decision support
aligned with MoHFW / National Health Mission (NHM) ASHA and frontline protocols.
"""

from typing import List, Tuple, Dict, Any, Optional
from datetime import datetime
import uuid

from .models import (
    AssessmentInput,
    AssessmentResult,
    RiskCategory,
    UrgencyLevel,
    FacilityType,
    TriggeredRule,
    FeatureContribution,
    VitalsInput,
)


def evaluate_triage(
    assessment_input: AssessmentInput,
    patient_name: str = "Demo Patient",
    patient_age: int = 58,
    patient_village: str = "Rampur Block",
    patient_id: Optional[str] = None,
) -> AssessmentResult:
    """Evaluates frontline symptoms and vitals deterministically.
    
    Produces risk category, urgency level, transparent rule triggers,
    feature contributions, and recommended care facility level.
    """
    vitals = assessment_input.vitals
    symptoms = [s.strip().lower() for s in assessment_input.symptoms]
    transcript = (assessment_input.voice_transcript or "").lower()
    
    # Check if voice transcript contains additional symptoms
    if "saans" in transcript or "breath" in transcript or "haaf" in transcript or "dyspnea" in transcript:
        if "breathlessness" not in [s.lower() for s in symptoms]:
            symptoms.append("breathlessness")
    if "bukhar" in transcript or "fever" in transcript or "taap" in transcript:
        if "fever" not in [s.lower() for s in symptoms]:
            symptoms.append("fever")
    if "chhati" in transcript or "chest pain" in transcript or "dard" in transcript and "chest" in transcript:
        if "chest pain" not in [s.lower() for s in symptoms]:
            symptoms.append("chest pain")
    if "chakkar" in transcript or "dizzy" in transcript or "fainting" in transcript:
        if "dizziness / syncope" not in [s.lower() for s in symptoms]:
            symptoms.append("dizziness / syncope")

    triggered_rules: List[TriggeredRule] = []
    feature_contributions: List[FeatureContribution] = []
    
    total_score = 0
    has_critical_red_flag = False
    has_warning_red_flag = False
    
    # 1. SpO2 EVALUATION (Oxygen Saturation)
    if vitals.spo2 is not None:
        if vitals.spo2 < 90.0:
            has_critical_red_flag = True
            points = 50
            total_score += points
            triggered_rules.append(
                TriggeredRule(
                    rule_id="RF-SPO2-CRITICAL",
                    rule_name="Critical Hypoxemia (SpO2 < 90%)",
                    severity="CRITICAL",
                    clinical_rationale=(
                        f"Measured SpO2 is {vitals.spo2:.1f}%, which is severely below the safe threshold (>=95%). "
                        "Critical risk of acute respiratory distress and tissue hypoxia."
                    ),
                    suggested_level="District Hospital (DH) / CHC with Oxygen",
                )
            )
            feature_contributions.append(
                FeatureContribution(
                    feature_name="Oxygen Saturation (SpO2)",
                    value=f"{vitals.spo2:.1f}%",
                    risk_impact="HIGH_RISK_TRIGGER",
                    points_weight=points,
                    note="Critical indicator requiring immediate supplemental oxygen therapy.",
                )
            )
        elif vitals.spo2 < 94.0:
            has_warning_red_flag = True
            points = 25
            total_score += points
            triggered_rules.append(
                TriggeredRule(
                    rule_id="RF-SPO2-MODERATE",
                    rule_name="Moderate Hypoxemia (SpO2 90-93%)",
                    severity="WARNING",
                    clinical_rationale=(
                        f"SpO2 is {vitals.spo2:.1f}%. Mild to moderate hypoxia warrants immediate medical evaluation "
                        "and proactive oxygen readiness."
                    ),
                    suggested_level="Community Health Centre (CHC)",
                )
            )
            feature_contributions.append(
                FeatureContribution(
                    feature_name="Oxygen Saturation (SpO2)",
                    value=f"{vitals.spo2:.1f}%",
                    risk_impact="MODERATE_RISK",
                    points_weight=points,
                    note="Below normal baseline (95-100%).",
                )
            )
        else:
            feature_contributions.append(
                FeatureContribution(
                    feature_name="Oxygen Saturation (SpO2)",
                    value=f"{vitals.spo2:.1f}%",
                    risk_impact="NORMAL",
                    points_weight=0,
                    note="Within normal clinical range.",
                )
            )
    else:
        feature_contributions.append(
            FeatureContribution(
                feature_name="Oxygen Saturation (SpO2)",
                value="Not recorded",
                risk_impact="NORMAL",
                points_weight=0,
                note="Not measured by pulse oximeter.",
            )
        )

    # 2. RESPIRATORY RATE & BREATHLESSNESS
    is_breathless = any(s in ["breathlessness", "shortness of breath", "difficulty breathing", "dyspnea"] for s in symptoms)
    if vitals.respiratory_rate is not None:
        if vitals.respiratory_rate >= 30:
            has_critical_red_flag = True
            points = 35
            total_score += points
            triggered_rules.append(
                TriggeredRule(
                    rule_id="RF-RESP-CRITICAL",
                    rule_name="Severe Tachypnea (RR >= 30 bpm)",
                    severity="CRITICAL",
                    clinical_rationale=f"Respiratory rate of {vitals.respiratory_rate} breaths/min denotes acute respiratory fatigue.",
                    suggested_level="District Hospital (DH)",
                )
            )
            feature_contributions.append(
                FeatureContribution(
                    feature_name="Respiratory Rate",
                    value=f"{vitals.respiratory_rate} bpm",
                    risk_impact="HIGH_RISK_TRIGGER",
                    points_weight=points,
                    note="Marked tachypnea.",
                )
            )
        elif vitals.respiratory_rate >= 24:
            points = 15
            total_score += points
            has_warning_red_flag = True
            triggered_rules.append(
                TriggeredRule(
                    rule_id="RF-RESP-ELEVATED",
                    rule_name="Elevated Respiratory Rate (RR 24-29 bpm)",
                    severity="WARNING",
                    clinical_rationale="Accelerated breathing indicates early compensation for metabolic/pulmonary distress.",
                    suggested_level="CHC / PHC",
                )
            )
            feature_contributions.append(
                FeatureContribution(
                    feature_name="Respiratory Rate",
                    value=f"{vitals.respiratory_rate} bpm",
                    risk_impact="MODERATE_RISK",
                    points_weight=points,
                    note="Elevated respiratory effort.",
                )
            )

    if is_breathless:
        points = 25
        total_score += points
        if vitals.spo2 is not None and vitals.spo2 < 92.0:
            has_critical_red_flag = True
            triggered_rules.append(
                TriggeredRule(
                    rule_id="RF-RESP-SPO2-SYNERGY",
                    rule_name="Combined Breathlessness with Low SpO2",
                    severity="CRITICAL",
                    clinical_rationale="Acute shortness of breath paired with sub-92% SpO2 signifies impending respiratory decompensation.",
                    suggested_level="District Hospital (DH) / CHC Emergency",
                )
            )
        else:
            has_warning_red_flag = True
            triggered_rules.append(
                TriggeredRule(
                    rule_id="RF-SYMPTOM-DYSPNEA",
                    rule_name="Active Dyspnea / Breathlessness",
                    severity="WARNING",
                    clinical_rationale="Patient reports active difficulty breathing.",
                    suggested_level="Community Health Centre (CHC)",
                )
            )
        feature_contributions.append(
            FeatureContribution(
                feature_name="Reported Breathlessness",
                value="Yes (Active)",
                risk_impact="HIGH_RISK_TRIGGER" if (vitals.spo2 and vitals.spo2 < 92) else "MODERATE_RISK",
                points_weight=points,
                note="Key cardinal symptom of respiratory or cardiac compromise.",
            )
        )

    # 3. TEMPERATURE & FEVER SYNERGY
    has_fever_symptom = any("fever" in s or "bukhar" in s for s in symptoms)
    if vitals.temperature is not None:
        if vitals.temperature >= 103.0:
            points = 25
            total_score += points
            has_warning_red_flag = True
            triggered_rules.append(
                TriggeredRule(
                    rule_id="RF-TEMP-HYPERPYREXIA",
                    rule_name="High-grade Hyperpyrexia (Temp >= 103°F)",
                    severity="WARNING",
                    clinical_rationale=f"Body temp is {vitals.temperature:.1f}°F. Danger of febrile delirium or systemic infection.",
                    suggested_level="Community Health Centre (CHC)",
                )
            )
            feature_contributions.append(
                FeatureContribution(
                    feature_name="Body Temperature",
                    value=f"{vitals.temperature:.1f}°F",
                    risk_impact="MODERATE_RISK",
                    points_weight=points,
                    note="High fever recorded.",
                )
            )
        elif vitals.temperature >= 100.4:
            points = 10
            total_score += points
            feature_contributions.append(
                FeatureContribution(
                    feature_name="Body Temperature",
                    value=f"{vitals.temperature:.1f}°F",
                    risk_impact="MODERATE_RISK",
                    points_weight=points,
                    note="Low/Moderate fever.",
                )
            )
    elif has_fever_symptom:
        points = 10
        total_score += points
        feature_contributions.append(
            FeatureContribution(
                feature_name="Fever Symptom",
                value="Present",
                risk_impact="MODERATE_RISK",
                points_weight=points,
                note="Reported febrile history.",
            )
        )

    # Breathlessness + Fever Synergy (Possible Pneumonia / SARI / Severe Lower Respiratory Infection)
    if is_breathless and (has_fever_symptom or (vitals.temperature and vitals.temperature >= 100.0)):
        points = 20
        total_score += points
        has_warning_red_flag = True
        triggered_rules.append(
            TriggeredRule(
                rule_id="RF-SYNERGY-FEVER-BREATH",
                rule_name="Dual Triad: Fever + Breathlessness",
                severity="WARNING" if not has_critical_red_flag else "CRITICAL",
                clinical_rationale="Synergy of pyrexia and dyspnea strongly indicates lower respiratory tract infection (e.g. pneumonia/SARI).",
                suggested_level="CHC or District Hospital",
            )
        )

    # 4. HEART RATE
    if vitals.heart_rate is not None:
        if vitals.heart_rate >= 130 or vitals.heart_rate < 50:
            points = 25
            total_score += points
            has_warning_red_flag = True
            triggered_rules.append(
                TriggeredRule(
                    rule_id="RF-HR-CRITICAL",
                    rule_name="Critical Tachycardia / Bradycardia",
                    severity="WARNING",
                    clinical_rationale=f"Pulse rate {vitals.heart_rate} BPM indicates haemodynamic stress or rhythm instability.",
                    suggested_level="Community Health Centre (CHC)",
                )
            )
            feature_contributions.append(
                FeatureContribution(
                    feature_name="Heart Rate",
                    value=f"{vitals.heart_rate} bpm",
                    risk_impact="MODERATE_RISK",
                    points_weight=points,
                    note="Significant deviation from normal 60-100 BPM.",
                )
            )
        elif vitals.heart_rate >= 100:
            points = 10
            total_score += points
            feature_contributions.append(
                FeatureContribution(
                    feature_name="Heart Rate",
                    value=f"{vitals.heart_rate} bpm",
                    risk_impact="MODERATE_RISK",
                    points_weight=points,
                    note="Mild tachycardia.",
                )
            )

    # 5. BLOOD PRESSURE
    if vitals.systolic_bp is not None or vitals.diastolic_bp is not None:
        sbp = vitals.systolic_bp or 120
        dbp = vitals.diastolic_bp or 80
        if sbp >= 180 or dbp >= 110:
            points = 35
            total_score += points
            has_critical_red_flag = True
            triggered_rules.append(
                TriggeredRule(
                    rule_id="RF-BP-HYPERTENSIVE-CRISIS",
                    rule_name="Hypertensive Crisis (SBP >= 180 or DBP >= 110)",
                    severity="CRITICAL",
                    clinical_rationale=f"BP {sbp}/{dbp} mmHg poses urgent threat of cerebrovascular or acute cardiovascular event.",
                    suggested_level="District Hospital (DH)",
                )
            )
            feature_contributions.append(
                FeatureContribution(
                    feature_name="Blood Pressure",
                    value=f"{sbp}/{dbp} mmHg",
                    risk_impact="HIGH_RISK_TRIGGER",
                    points_weight=points,
                    note="Hypertensive emergency range.",
                )
            )
        elif sbp < 90:
            points = 35
            total_score += points
            has_critical_red_flag = True
            triggered_rules.append(
                TriggeredRule(
                    rule_id="RF-BP-HYPOTENSION-SHOCK",
                    rule_name="Severe Hypotension / Shock (SBP < 90)",
                    severity="CRITICAL",
                    clinical_rationale=f"SBP {sbp} mmHg indicates severe hypoperfusion / circulatory shock.",
                    suggested_level="District Hospital (DH) / CHC",
                )
            )
            feature_contributions.append(
                FeatureContribution(
                    feature_name="Blood Pressure",
                    value=f"{sbp}/{dbp} mmHg",
                    risk_impact="HIGH_RISK_TRIGGER",
                    points_weight=points,
                    note="Circulatory shock danger.",
                )
            )

    # 6. OTHER CARDINAL RED FLAGS
    has_chest_pain = any("chest pain" in s for s in symptoms)
    if has_chest_pain:
        points = 30
        total_score += points
        has_critical_red_flag = True
        triggered_rules.append(
            TriggeredRule(
                rule_id="RF-SYMPTOM-CHEST-PAIN",
                rule_name="Acute Chest Pain / Angina Red Flag",
                severity="CRITICAL",
                clinical_rationale="Acute chest discomfort requires immediate ECG evaluation to rule out Acute Coronary Syndrome.",
                suggested_level="District Hospital (DH) / Emergency CHC",
            )
        )
        feature_contributions.append(
            FeatureContribution(
                feature_name="Chest Pain",
                value="Present",
                risk_impact="HIGH_RISK_TRIGGER",
                points_weight=points,
                note="Potential acute cardiac emergency.",
            )
        )

    # Age vulnerability factor
    if patient_age >= 60:
        points = 10
        total_score += points
        feature_contributions.append(
            FeatureContribution(
                feature_name="Age Vulnerability (Elderly)",
                value=f"{patient_age} yrs",
                risk_impact="MODERATE_RISK" if (has_warning_red_flag or has_critical_red_flag) else "NORMAL",
                points_weight=points,
                note="Geriatric age group increases vulnerability to rapid progression.",
            )
        )

    # DETERMINE OVERALL RISK & URGENCY CATEGORY
    if has_critical_red_flag or total_score >= 50:
        risk_category = RiskCategory.HIGH
        urgency = UrgencyLevel.EMERGENCY_IMMEDIATE
        recommended_care_level = FacilityType.DISTRICT_HOSPITAL
        recommended_action = (
            "🚨 IMMEDIATE ESCALATION REQUIRED: Patient exhibits critical warning signs. "
            "1. Initiate 108 Emergency Ambulance transport immediately. "
            "2. Keep patient in propped-up upright sitting position (semi-Fowler). "
            "3. Administer high-flow supplemental oxygen if trained and portable cylinder is available at SHC/PHC. "
            "4. Inform Medical Officer (MO) at receiving District Hospital / CHC before arrival."
        )
    elif has_warning_red_flag or total_score >= 25:
        risk_category = RiskCategory.MODERATE
        urgency = UrgencyLevel.URGENT_SAME_DAY
        recommended_care_level = FacilityType.CHC
        recommended_action = (
            "⚠️ SAME-DAY CLINICAL EVALUATION: Patient requires doctor consultation within 6-12 hours. "
            "1. Refer to nearest Community Health Centre (CHC) or Primary Health Centre (PHC). "
            "2. Provide paracetamol for fever if within ASHA kit protocol. "
            "3. Instruct patient/family on danger signs and advise immediate emergency return if breathing worsens."
        )
    else:
        risk_category = RiskCategory.LOW
        urgency = UrgencyLevel.ROUTINE_SCHEDULED
        recommended_care_level = FacilityType.PHC
        recommended_action = (
            "✅ ROUTINE / PRIMARY CARE: Symptoms indicate mild or non-emergency condition. "
            "1. Schedule routine consultation at Sub-Centre or local PHC OPD. "
            "2. Ensure hydration, rest, and home monitoring. "
            "3. Schedule ASHA follow-up visit in 48-72 hours."
        )

    # Is this the illustrative hackathon demo case? (Age 58, SpO2 89, Breathlessness & Fever)
    is_demo_case = (
        patient_age == 58
        and (vitals.spo2 is not None and vitals.spo2 <= 89.5)
        and is_breathless
    )

    sample_facility_options = [
        {
            "id": "FAC-DH-01",
            "name": "District Hospital (DH) Civil Medical Center",
            "facility_type": "District Hospital (DH)",
            "distance_km": 14.2,
            "est_time": "25-30 mins",
            "emergency_ready": True,
            "oxygen_supported": True,
            "match_reason": "Equipped with 24/7 ICU, oxygen manifold, and specialist physicians.",
        },
        {
            "id": "FAC-CHC-02",
            "name": "Community Health Centre (CHC) Rampur",
            "facility_type": "Community Health Centre (CHC)",
            "distance_km": 6.5,
            "est_time": "12-15 mins",
            "emergency_ready": True,
            "oxygen_supported": True,
            "match_reason": "Nearest secondary facility with inpatient beds and emergency stabilization.",
        },
        {
            "id": "FAC-PHC-03",
            "name": "Primary Health Centre (PHC) Chandanpur",
            "facility_type": "Primary Health Centre (PHC)",
            "distance_km": 2.8,
            "est_time": "6-8 mins",
            "emergency_ready": False,
            "oxygen_supported": False,
            "match_reason": "Nearest daytime outpatient clinic for initial triage note.",
        },
    ]

    return AssessmentResult(
        id=f"ASSESS-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}",
        patient_id=patient_id or f"PAT-DEMO-{uuid.uuid4().hex[:4].upper()}",
        patient_name=patient_name,
        patient_age=patient_age,
        patient_village=patient_village,
        symptoms=symptoms if symptoms else ["General malaise"],
        symptom_duration=assessment_input.symptom_duration,
        vitals=vitals,
        voice_transcript=assessment_input.voice_transcript,
        risk_category=risk_category,
        urgency=urgency,
        score=total_score,
        triggered_rules=triggered_rules,
        feature_contributions=feature_contributions,
        recommended_care_level=recommended_care_level,
        recommended_action=recommended_action,
        facility_options=sample_facility_options,
        human_review_status="Pending ASHA Confirmation",
        created_at=datetime.now().isoformat(),
        is_demo_case=is_demo_case,
    )
