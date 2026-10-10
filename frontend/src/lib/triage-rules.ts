import {
  AssessmentResult,
  RiskCategory,
  UrgencyLevel,
  FacilityType,
  TriggeredRule,
  FeatureContribution,
  VitalsInput,
  FacilityOption,
} from '@/types';

export interface EvaluateParams {
  patientName: string;
  patientAge: number;
  patientVillage: string;
  patientId?: string;
  symptoms: string[];
  symptomDuration?: string;
  vitals: VitalsInput;
  voiceTranscript?: string;
  ashaNotes?: string;
}

export const SAMPLE_FACILITIES: FacilityOption[] = [
  {
    id: 'FAC-DH-01',
    name: 'District Hospital (DH) Civil Medical Center',
    facility_type: 'District Hospital (DH)',
    distance_km: 14.2,
    est_time: '25-30 mins',
    emergency_ready: true,
    oxygen_supported: true,
    match_reason: 'Equipped with 24/7 ICU, continuous oxygen manifold, and specialist physicians.',
  },
  {
    id: 'FAC-CHC-02',
    name: 'Community Health Centre (CHC) Rampur',
    facility_type: 'Community Health Centre (CHC)',
    distance_km: 6.5,
    est_time: '12-15 mins',
    emergency_ready: true,
    oxygen_supported: true,
    match_reason: 'Nearest secondary facility with inpatient beds and emergency stabilization.',
  },
  {
    id: 'FAC-PHC-03',
    name: 'Primary Health Centre (PHC) Chandanpur',
    facility_type: 'Primary Health Centre (PHC)',
    distance_km: 2.8,
    est_time: '6-8 mins',
    emergency_ready: false,
    oxygen_supported: false,
    match_reason: 'Nearest daytime outpatient clinic for general medical evaluation.',
  },
];

export function evaluateTriageClient(params: EvaluateParams): AssessmentResult {
  const {
    patientName,
    patientAge,
    patientVillage,
    patientId,
    symptoms: rawSymptoms,
    symptomDuration = '1-2 days',
    vitals,
    voiceTranscript = '',
  } = params;

  const symptoms = [...rawSymptoms];
  const transcript = voiceTranscript.toLowerCase();

  // Voice transcript extraction fallback
  if (
    transcript.includes('saans') ||
    transcript.includes('breath') ||
    transcript.includes('haaf') ||
    transcript.includes('dyspnea')
  ) {
    if (!symptoms.some((s) => s.toLowerCase().includes('breath'))) {
      symptoms.push('Breathlessness');
    }
  }
  if (
    transcript.includes('bukhar') ||
    transcript.includes('fever') ||
    transcript.includes('taap')
  ) {
    if (!symptoms.some((s) => s.toLowerCase().includes('fever'))) {
      symptoms.push('Fever');
    }
  }
  if (
    transcript.includes('chhati') ||
    transcript.includes('chest pain') ||
    (transcript.includes('dard') && transcript.includes('chest'))
  ) {
    if (!symptoms.some((s) => s.toLowerCase().includes('chest'))) {
      symptoms.push('Chest Pain');
    }
  }

  const triggered_rules: TriggeredRule[] = [];
  const feature_contributions: FeatureContribution[] = [];

  let total_score = 0;
  let has_critical_red_flag = false;
  let has_warning_red_flag = false;

  // 1. SpO2 EVALUATION
  if (vitals.spo2 !== null && vitals.spo2 !== undefined) {
    const spo2 = Number(vitals.spo2);
    if (spo2 < 90.0) {
      has_critical_red_flag = true;
      const points = 50;
      total_score += points;
      triggered_rules.push({
        rule_id: 'RF-SPO2-CRITICAL',
        rule_name: 'Critical Hypoxemia (SpO2 < 90%)',
        severity: 'CRITICAL',
        clinical_rationale: `Measured SpO2 is ${spo2.toFixed(1)}%, which is critically below the normal baseline (>=95%). Urgent oxygenation required.`,
        suggested_level: 'District Hospital (DH) / CHC with Oxygen',
      });
      feature_contributions.push({
        feature_name: 'Oxygen Saturation (SpO2)',
        value: `${spo2.toFixed(1)}%`,
        risk_impact: 'HIGH_RISK_TRIGGER',
        points_weight: points,
        note: 'Severe hypoxemia requiring immediate high-flow oxygen.',
      });
    } else if (spo2 < 94.0) {
      has_warning_red_flag = true;
      const points = 25;
      total_score += points;
      triggered_rules.push({
        rule_id: 'RF-SPO2-MODERATE',
        rule_name: 'Moderate Hypoxemia (SpO2 90-93%)',
        severity: 'WARNING',
        clinical_rationale: `SpO2 is ${spo2.toFixed(1)}%. Moderate desaturation warrants same-day medical review.`,
        suggested_level: 'Community Health Centre (CHC)',
      });
      feature_contributions.push({
        feature_name: 'Oxygen Saturation (SpO2)',
        value: `${spo2.toFixed(1)}%`,
        risk_impact: 'MODERATE_RISK',
        points_weight: points,
        note: 'Below normal baseline (95-100%).',
      });
    } else {
      feature_contributions.push({
        feature_name: 'Oxygen Saturation (SpO2)',
        value: `${spo2.toFixed(1)}%`,
        risk_impact: 'NORMAL',
        points_weight: 0,
        note: 'Healthy baseline reading.',
      });
    }
  } else {
    feature_contributions.push({
      feature_name: 'Oxygen Saturation (SpO2)',
      value: 'Not recorded',
      risk_impact: 'NORMAL',
      points_weight: 0,
      note: 'Pulse oximeter reading omitted.',
    });
  }

  // 2. RESPIRATORY EFFORT & BREATHLESSNESS
  const isBreathless = symptoms.some((s) => {
    const l = s.toLowerCase();
    return (
      l.includes('breath') ||
      l.includes('saans') ||
      l.includes('dyspnea') ||
      l.includes('shortness')
    );
  });

  if (vitals.respiratory_rate) {
    const rr = Number(vitals.respiratory_rate);
    if (rr >= 30) {
      has_critical_red_flag = true;
      const points = 35;
      total_score += points;
      triggered_rules.push({
        rule_id: 'RF-RESP-CRITICAL',
        rule_name: 'Severe Tachypnea (RR >= 30 bpm)',
        severity: 'CRITICAL',
        clinical_rationale: `Respiratory rate of ${rr} breaths/min denotes acute respiratory fatigue.`,
        suggested_level: 'District Hospital (DH)',
      });
      feature_contributions.push({
        feature_name: 'Respiratory Rate',
        value: `${rr} bpm`,
        risk_impact: 'HIGH_RISK_TRIGGER',
        points_weight: points,
        note: 'Extreme respiratory effort.',
      });
    } else if (rr >= 24) {
      has_warning_red_flag = true;
      const points = 15;
      total_score += points;
      triggered_rules.push({
        rule_id: 'RF-RESP-ELEVATED',
        rule_name: 'Elevated Respiratory Rate (RR 24-29 bpm)',
        severity: 'WARNING',
        clinical_rationale: 'Accelerated breathing signifies pulmonary compensation.',
        suggested_level: 'CHC / PHC',
      });
      feature_contributions.push({
        feature_name: 'Respiratory Rate',
        value: `${rr} bpm`,
        risk_impact: 'MODERATE_RISK',
        points_weight: points,
        note: 'Elevated tachypnea.',
      });
    }
  }

  if (isBreathless) {
    const points = 25;
    total_score += points;
    const spo2Val = vitals.spo2 ? Number(vitals.spo2) : null;
    if (spo2Val !== null && spo2Val < 92.0) {
      has_critical_red_flag = true;
      triggered_rules.push({
        rule_id: 'RF-RESP-SPO2-SYNERGY',
        rule_name: 'Combined Breathlessness with Low SpO2',
        severity: 'CRITICAL',
        clinical_rationale: 'Shortness of breath with sub-92% SpO2 indicates severe respiratory compromise.',
        suggested_level: 'District Hospital (DH) / CHC Emergency',
      });
    } else {
      has_warning_red_flag = true;
      triggered_rules.push({
        rule_id: 'RF-SYMPTOM-DYSPNEA',
        rule_name: 'Active Dyspnea / Breathlessness',
        severity: 'WARNING',
        clinical_rationale: 'Patient exhibits or reports active breathing discomfort.',
        suggested_level: 'Community Health Centre (CHC)',
      });
    }
    feature_contributions.push({
      feature_name: 'Reported Breathlessness',
      value: 'Yes (Active)',
      risk_impact: (spo2Val !== null && spo2Val < 92) ? 'HIGH_RISK_TRIGGER' : 'MODERATE_RISK',
      points_weight: points,
      note: 'Key cardinal respiratory warning sign.',
    });
  }

  // 3. FEVER & SYNERGY
  const hasFever = symptoms.some((s) => s.toLowerCase().includes('fever') || s.toLowerCase().includes('bukhar'));
  if (vitals.temperature) {
    const temp = Number(vitals.temperature);
    if (temp >= 103.0) {
      has_warning_red_flag = true;
      const points = 25;
      total_score += points;
      triggered_rules.push({
        rule_id: 'RF-TEMP-HYPERPYREXIA',
        rule_name: 'High-grade Hyperpyrexia (Temp >= 103°F)',
        severity: 'WARNING',
        clinical_rationale: `Recorded body temperature is ${temp.toFixed(1)}°F. Danger of systemic septic shock.`,
        suggested_level: 'Community Health Centre (CHC)',
      });
      feature_contributions.push({
        feature_name: 'Body Temperature',
        value: `${temp.toFixed(1)}°F`,
        risk_impact: 'MODERATE_RISK',
        points_weight: points,
        note: 'Significant hyperpyrexia.',
      });
    } else if (temp >= 100.4) {
      const points = 10;
      total_score += points;
      feature_contributions.push({
        feature_name: 'Body Temperature',
        value: `${temp.toFixed(1)}°F`,
        risk_impact: 'MODERATE_RISK',
        points_weight: points,
        note: 'Moderate febrile state.',
      });
    }
  } else if (hasFever) {
    const points = 10;
    total_score += points;
    feature_contributions.push({
      feature_name: 'Reported Fever',
      value: 'Present',
      risk_impact: 'MODERATE_RISK',
      points_weight: points,
      note: 'Febrile history reported.',
    });
  }

  // Fever + Breathlessness Synergy
  if (isBreathless && (hasFever || (vitals.temperature && Number(vitals.temperature) >= 100.0))) {
    const points = 20;
    total_score += points;
    has_warning_red_flag = true;
    triggered_rules.push({
      rule_id: 'RF-SYNERGY-FEVER-BREATH',
      rule_name: 'Dual Triad: Fever + Breathlessness',
      severity: has_critical_red_flag ? 'CRITICAL' : 'WARNING',
      clinical_rationale: 'Combination of fever and breathlessness strongly correlates with acute lower respiratory infection (pneumonia/SARI).',
      suggested_level: 'District Hospital / CHC with Oxygen',
    });
  }

  // 4. HEART RATE
  if (vitals.heart_rate) {
    const hr = Number(vitals.heart_rate);
    if (hr >= 130 || hr < 50) {
      has_warning_red_flag = true;
      const points = 25;
      total_score += points;
      triggered_rules.push({
        rule_id: 'RF-HR-CRITICAL',
        rule_name: 'Severe Tachycardia / Bradycardia',
        severity: 'WARNING',
        clinical_rationale: `Pulse rate ${hr} BPM suggests severe haemodynamic stress.`,
        suggested_level: 'Community Health Centre (CHC)',
      });
      feature_contributions.push({
        feature_name: 'Heart Rate',
        value: `${hr} bpm`,
        risk_impact: 'MODERATE_RISK',
        points_weight: points,
        note: 'Abnormal pulse frequency.',
      });
    } else if (hr >= 100) {
      const points = 10;
      total_score += points;
      feature_contributions.push({
        feature_name: 'Heart Rate',
        value: `${hr} bpm`,
        risk_impact: 'MODERATE_RISK',
        points_weight: points,
        note: 'Mild resting tachycardia.',
      });
    }
  }

  // 5. BLOOD PRESSURE
  if (vitals.systolic_bp || vitals.diastolic_bp) {
    const sbp = Number(vitals.systolic_bp || 120);
    const dbp = Number(vitals.diastolic_bp || 80);
    if (sbp >= 180 || dbp >= 110) {
      has_critical_red_flag = true;
      const points = 35;
      total_score += points;
      triggered_rules.push({
        rule_id: 'RF-BP-HYPERTENSIVE-CRISIS',
        rule_name: 'Hypertensive Crisis (SBP >= 180 or DBP >= 110)',
        severity: 'CRITICAL',
        clinical_rationale: `BP ${sbp}/${dbp} mmHg poses severe risk of acute cerebrovascular or cardiovascular damage.`,
        suggested_level: 'District Hospital (DH)',
      });
      feature_contributions.push({
        feature_name: 'Blood Pressure',
        value: `${sbp}/${dbp} mmHg`,
        risk_impact: 'HIGH_RISK_TRIGGER',
        points_weight: points,
        note: 'Emergency blood pressure range.',
      });
    } else if (sbp < 90) {
      has_critical_red_flag = true;
      const points = 35;
      total_score += points;
      triggered_rules.push({
        rule_id: 'RF-BP-HYPOTENSION-SHOCK',
        rule_name: 'Severe Hypotension / Shock (SBP < 90)',
        severity: 'CRITICAL',
        clinical_rationale: `SBP ${sbp} mmHg indicates severe circulatory shock.`,
        suggested_level: 'District Hospital (DH) / CHC Emergency',
      });
      feature_contributions.push({
        feature_name: 'Blood Pressure',
        value: `${sbp}/${dbp} mmHg`,
        risk_impact: 'HIGH_RISK_TRIGGER',
        points_weight: points,
        note: 'Circulatory shock threshold.',
      });
    }
  }

  // 6. CHEST PAIN
  const hasChestPain = symptoms.some((s) => s.toLowerCase().includes('chest'));
  if (hasChestPain) {
    has_critical_red_flag = true;
    const points = 30;
    total_score += points;
    triggered_rules.push({
      rule_id: 'RF-SYMPTOM-CHEST-PAIN',
      rule_name: 'Acute Chest Pain / Angina Red Flag',
      severity: 'CRITICAL',
      clinical_rationale: 'Acute chest discomfort requires immediate 12-lead ECG to rule out Acute Coronary Syndrome.',
      suggested_level: 'District Hospital (DH)',
    });
    feature_contributions.push({
      feature_name: 'Chest Discomfort',
      value: 'Present',
      risk_impact: 'HIGH_RISK_TRIGGER',
      points_weight: points,
      note: 'Potential acute cardiac syndrome.',
    });
  }

  // Age factor
  if (patientAge >= 60) {
    const points = 10;
    total_score += points;
    feature_contributions.push({
      feature_name: 'Age Vulnerability (Elderly)',
      value: `${patientAge} yrs`,
      risk_impact: (has_warning_red_flag || has_critical_red_flag) ? 'MODERATE_RISK' : 'NORMAL',
      points_weight: points,
      note: 'Geriatric age elevates clinical risk.',
    });
  }

  // OUTCOME
  let risk_category: RiskCategory;
  let urgency: UrgencyLevel;
  let recommended_care_level: FacilityType;
  let recommended_action: string;

  if (has_critical_red_flag || total_score >= 50) {
    risk_category = 'HIGH';
    urgency = 'EMERGENCY_IMMEDIATE';
    recommended_care_level = 'District Hospital (DH)';
    recommended_action =
      '🚨 IMMEDIATE ESCALATION REQUIRED: Patient exhibits critical warning signs. ' +
      '1. Dispatch 108 Emergency Ambulance transport immediately. ' +
      '2. Keep patient in propped-up upright sitting position (semi-Fowler). ' +
      '3. Administer high-flow supplemental oxygen if trained and portable cylinder is available at SHC/PHC. ' +
      '4. Inform Medical Officer (MO) at receiving District Hospital / CHC before arrival.';
  } else if (has_warning_red_flag || total_score >= 25) {
    risk_category = 'MODERATE';
    urgency = 'URGENT_SAME_DAY';
    recommended_care_level = 'Community Health Centre (CHC)';
    recommended_action =
      '⚠️ SAME-DAY CLINICAL EVALUATION: Patient requires doctor consultation within 6-12 hours. ' +
      '1. Refer to nearest Community Health Centre (CHC) or Primary Health Centre (PHC). ' +
      '2. Provide paracetamol for fever if within ASHA kit protocol. ' +
      '3. Instruct family on emergency signs and call 108 if breathlessness increases.';
  } else {
    risk_category = 'LOW';
    urgency = 'ROUTINE_SCHEDULED';
    recommended_care_level = 'Primary Health Centre (PHC)';
    recommended_action =
      '✅ ROUTINE / PRIMARY CARE: Symptoms indicate mild or non-emergency condition. ' +
      '1. Schedule routine consultation at Sub-Centre or local PHC OPD. ' +
      '2. Ensure hydration, rest, and home monitoring. ' +
      '3. Schedule ASHA follow-up visit in 48-72 hours.';
  }

  const is_demo_case =
    patientAge === 58 &&
    vitals.spo2 !== null &&
    Number(vitals.spo2) <= 89.5 &&
    isBreathless;

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();

  return {
    id: `ASSESS-${dateStr}-${randomHex}`,
    patient_id: patientId || `PAT-DEMO-${Math.random().toString(16).substring(2, 6).toUpperCase()}`,
    patient_name: patientName,
    patient_age: patientAge,
    patient_village: patientVillage,
    symptoms: symptoms.length > 0 ? symptoms : ['General malaise'],
    symptom_duration: symptomDuration,
    vitals,
    voice_transcript: voiceTranscript,
    risk_category,
    urgency,
    score: total_score,
    triggered_rules,
    feature_contributions,
    recommended_care_level,
    recommended_action,
    facility_options: SAMPLE_FACILITIES,
    human_review_status: 'Pending ASHA Confirmation',
    created_at: now.toISOString(),
    is_demo_case,
    disclaimer:
      'Prototype clinical decision support rule engine. Not certified for autonomous diagnosis. Frontline workers must follow standard MoHFW/NHM protocol.',
  };
}
