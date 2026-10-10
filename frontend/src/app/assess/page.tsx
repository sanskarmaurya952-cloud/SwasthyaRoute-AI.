'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { speechService, SpeechState } from '@/lib/speech';
import { AssessmentResult, Facility, FacilityOption, VitalsInput } from '@/types';
import { RiskBadge } from '@/components/common/RiskBadge';
import { UrgencyPill } from '@/components/common/UrgencyPill';
import { SafetyBanner } from '@/components/common/SafetyBanner';
import {
  Mic,
  MicOff,
  Sparkles,
  HeartPulse,
  Thermometer,
  Wind,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Send,
  Save,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Building2,
  FileText,
  Clock,
  Printer,
  Ambulance,
  HelpCircle,
} from 'lucide-react';

const COMMON_SYMPTOMS = [
  'Breathlessness / Saans mein dikkat',
  'Fever / Bukhar',
  'Cough / Khansi',
  'Chest Pain / Chhati mein dard',
  'Dizziness / Chakkar',
  'Severe Headache / Tez sar dard',
  'Vomiting / Ulti',
  'Abdominal Pain / Pet dard',
  'Swelling in legs / Pairon mein sujan',
  'High Blood Pressure / Tez BP',
];

const PRE_EXISTING_OPTIONS = [
  'Hypertension / High BP',
  'Diabetes / Madhumeh',
  'Asthma / Dama',
  'COPD / Chronic Lung Disease',
  'Smoker',
  'Heart Disease / Dil ki bimari',
];

function AssessPatientContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Step state (1: Info, 2: Voice & Vitals, 3: Review & Evaluate, 4: Result & Referral)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [demoId, setDemoId] = useState(`PAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [sex, setSex] = useState('Unspecified');
  const [village, setVillage] = useState('Rampur Kalan');
  const [phone, setPhone] = useState('');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [isPregnant, setIsPregnant] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [symptomDuration, setSymptomDuration] = useState('1-2 days');

  // Voice & Vitals
  const [speechState, setSpeechState] = useState<SpeechState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    isSupported: true,
    language: 'hi-IN',
  });
  const [voiceLang, setVoiceLang] = useState('hi-IN');
  const [vitals, setVitals] = useState<VitalsInput>({
    spo2: null,
    heart_rate: null,
    temperature: null,
    respiratory_rate: null,
    systolic_bp: null,
    diastolic_bp: null,
  });
  const [ashaNotes, setAshaNotes] = useState('');

  // Assessment Evaluation & Result
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);

  // Referral Modal State
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState('FAC-DH-01');
  const [referralTransport, setReferralTransport] = useState('108 Emergency Ambulance (Dispatched)');
  const [referralNotes, setReferralNotes] = useState('');
  const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);
  const [referralSuccessMsg, setReferralSuccessMsg] = useState<string | null>(null);

  // Subscribe to speech service
  useEffect(() => {
    speechService.subscribe((state) => {
      setSpeechState(state);
    });
  }, []);

  // Check if ?demo=true was passed in URL query
  useEffect(() => {
    if (searchParams.get('demo') === 'true') {
      loadDemoScenario();
    }
  }, [searchParams]);

  // Load the 90-second Hackathon Illustrative Case (Age 58, Breathlessness, Fever, SpO2 89%)
  const loadDemoScenario = () => {
    setFullName('Rameshwar Sharma');
    setAge(58);
    setSex('Male');
    setVillage('Rampur Kalan');
    setPhone('+91 98765 43210');
    setSelectedConditions(['Hypertension / High BP', 'Smoker']);
    setIsPregnant(false);
    setSelectedSymptoms(['Breathlessness / Saans mein dikkat', 'Fever / Bukhar', 'Cough / Khansi']);
    setSymptomDuration('2 days');

    const transcript = 'Patient ko saans lene mein dikkat hai aur fever hai.';
    speechService.setTranscript(transcript);

    setVitals({
      spo2: 89.0,
      heart_rate: 112,
      temperature: 101.4,
      respiratory_rate: 28,
      systolic_bp: 142,
      diastolic_bp: 88,
    });
    setAshaNotes('Patient in acute distress, sitting propped up on cot. Breath sounds harsh.');
    setCurrentStep(2);
  };

  const handleToggleCondition = (cond: string) => {
    setSelectedConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    );
  };

  const handleToggleSymptom = (sym: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleAddCustomSymptom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSymptom.trim()) {
      if (!selectedSymptoms.includes(customSymptom.trim())) {
        setSelectedSymptoms((prev) => [...prev, customSymptom.trim()]);
      }
      setCustomSymptom('');
    }
  };

  const handleMicToggle = () => {
    if (speechState.isListening) {
      speechService.stopListening();
    } else {
      speechService.setLanguage(voiceLang);
      speechService.startListening();
    }
  };

  const handleLanguageChange = (lang: string) => {
    setVoiceLang(lang);
    speechService.setLanguage(lang);
  };

  const handleRunAssessment = async () => {
    setIsEvaluating(true);

    try {
      const result = await api.createAssessment({
        patient_info: {
          demo_identifier: demoId,
          full_name: fullName || 'Demo Patient',
          age: Number(age) || 58,
          sex,
          village,
          phone_number: phone,
          existing_conditions: selectedConditions,
          pregnancy_status: isPregnant,
          notes: ashaNotes,
        },
        symptoms: selectedSymptoms.map((s) => s.split(' / ')[0]),
        symptom_duration: symptomDuration,
        vitals,
        voice_transcript: speechState.transcript,
        language_used: voiceLang,
        asha_notes: ashaNotes,
      });

      setAssessmentResult(result);
      setCurrentStep(4);
    } catch (err) {
      console.error('Assessment evaluation error:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCreateReferralSubmit = async () => {
    if (!assessmentResult) return;
    setIsSubmittingReferral(true);

    try {
      await api.createReferral({
        assessment_id: assessmentResult.id,
        patient_id: assessmentResult.patient_id,
        destination_facility_id: selectedFacilityId,
        reason: `${assessmentResult.risk_category} Risk: ${assessmentResult.symptoms.join(', ')} (SpO₂: ${assessmentResult.vitals.spo2 ?? 'N/A'}%)`,
        urgency: assessmentResult.urgency,
        notes: referralNotes || `Referred by ASHA worker. Transport: ${referralTransport}`,
      });

      setShowReferralModal(false);
      setReferralSuccessMsg('Referral successfully created and routed to destination facility!');
      setTimeout(() => {
        router.push('/referrals');
      }, 1500);
    } catch (err) {
      console.error('Referral creation error:', err);
    } finally {
      setIsSubmittingReferral(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Steps Tracker */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#12304A]">
                Frontline Patient Assessment
              </h1>
              <span className="text-xs bg-[#EAF4F8] text-[#087F8C] font-semibold px-2 py-0.5 rounded border border-[#087F8C]/20">
                ASHA Clinical Decision Support
              </span>
            </div>
            <p className="text-xs text-[#536779] mt-0.5">
              Multi-modal assessment with speech recognition & transparent red-flag triage logic
            </p>
          </div>

          <button
            onClick={loadDemoScenario}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs rounded-lg transition shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Load Demo Case (SpO₂ 89%)</span>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          {[
            { num: 1, label: 'Patient Info' },
            { num: 2, label: 'Voice & Vitals' },
            { num: 3, label: 'Review Rules' },
            { num: 4, label: 'Result & Routing' },
          ].map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;

            return (
              <button
                key={s.num}
                onClick={() => {
                  if (s.num <= currentStep || (assessmentResult && s.num === 4)) {
                    setCurrentStep(s.num as any);
                  }
                }}
                className={`py-2 px-2 rounded-lg text-left transition flex items-center gap-2 ${
                  isCurrent
                    ? 'bg-[#EAF4F8] text-[#12304A] border-b-2 border-[#087F8C]'
                    : isCompleted
                    ? 'text-emerald-700 bg-emerald-50/50'
                    : 'text-slate-400 bg-slate-50'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-[#087F8C] text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? '✓' : s.num}
                </div>
                <span className="text-xs font-semibold hidden md:inline truncate">
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <SafetyBanner />

      {/* STEP 1: PATIENT INFORMATION */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-[#12304A]">Step 1: Patient Demographic & Symptom Profile</h2>
            <p className="text-xs text-[#536779]">
              Frontline identifier and initial history collection. Demo identifiers protect real privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#12304A] mb-1">
                Demo Identifier
              </label>
              <input
                type="text"
                value={demoId}
                onChange={(e) => setDemoId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-slate-50 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12304A] mb-1">
                Patient Full Name / Alias <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Rameshwar Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#087F8C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12304A] mb-1">
                Age (Years) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 58"
                value={age}
                onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#087F8C]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12304A] mb-1">
                Sex
              </label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Unspecified">Unspecified</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12304A] mb-1">
                Village / Habitation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#12304A] mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Pregnancy Toggle for Women */}
          {sex === 'Female' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-900">Is the patient currently pregnant?</span>
                <p className="text-[11px] text-rose-700">Activates maternal danger sign and pre-eclampsia monitoring rules.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPregnant}
                  onChange={(e) => setIsPregnant(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>
          )}

          {/* Pre-existing Conditions */}
          <div>
            <label className="block text-xs font-semibold text-[#12304A] mb-2">
              Pre-existing Medical Conditions (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {PRE_EXISTING_OPTIONS.map((cond) => {
                const isSelected = selectedConditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => handleToggleCondition(cond)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      isSelected
                        ? 'bg-[#12304A] text-white border-[#12304A]'
                        : 'bg-slate-50 text-[#536779] border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cond}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Symptoms Multi-Select */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-[#12304A]">
                Reported Symptoms <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#536779]">Duration:</span>
                <select
                  value={symptomDuration}
                  onChange={(e) => setSymptomDuration(e.target.value)}
                  className="text-xs border border-slate-200 rounded px-2 py-0.5 bg-white"
                >
                  <option value="< 24 hours">&lt; 24 hours</option>
                  <option value="1-2 days">1-2 days</option>
                  <option value="3-5 days">3-5 days</option>
                  <option value="> 1 week">&gt; 1 week</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
              {COMMON_SYMPTOMS.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => handleToggleSymptom(sym)}
                    className={`px-3 py-2 rounded-lg text-xs text-left font-medium border transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#EAF4F8] text-[#12304A] border-[#087F8C] font-semibold'
                        : 'bg-white text-[#536779] border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{sym}</span>
                    {isSelected && <span className="text-[#087F8C] font-bold">✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Custom Symptom Add */}
            <form onSubmit={handleAddCustomSymptom} className="flex gap-2">
              <input
                type="text"
                placeholder="Type additional symptom and press Enter..."
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#087F8C]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#12304A] text-xs font-semibold rounded-lg"
              >
                + Add
              </button>
            </form>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#087F8C] hover:bg-[#066670] text-white font-semibold text-xs rounded-lg transition shadow-xs"
            >
              <span>Next: Voice & Vitals</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: VOICE AND VITALS */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Voice Input & Hindi Transcription Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-[#12304A] flex items-center gap-2">
                  <Mic className="w-4 h-4 text-[#087F8C]" />
                  <span>Voice Assessment & Speech-to-Text</span>
                </h2>
                <p className="text-xs text-[#536779]">
                  Frontline multilingual voice recording (Hindi `hi-IN` & Indian English)
                </p>
              </div>

              {/* Language Selection */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#536779]">Language:</span>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('hi-IN')}
                  className={`px-2.5 py-1 text-xs rounded-md font-semibold transition ${
                    voiceLang === 'hi-IN'
                      ? 'bg-[#12304A] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  हिन्दी (Hindi)
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange('en-IN')}
                  className={`px-2.5 py-1 text-xs rounded-md font-semibold transition ${
                    voiceLang === 'en-IN'
                      ? 'bg-[#12304A] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  English (IN)
                </button>
              </div>
            </div>

            {/* Mic Controls and Live Waveform */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-4">
              <button
                type="button"
                onClick={handleMicToggle}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-md shrink-0 ${
                  speechState.isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-[#087F8C] hover:bg-[#066670] text-white'
                }`}
              >
                {speechState.isListening ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </button>

              <div className="flex-1 text-center md:text-left space-y-1">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="text-xs font-bold text-[#12304A]">
                    {speechState.isListening
                      ? '🎙️ Listening... Speak patient symptoms in Hindi or English'
                      : 'Tap microphone to speak symptoms'}
                  </span>
                  {speechState.isListening && (
                    <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                  )}
                </div>
                <p className="text-[11px] text-[#536779]">
                  Try speaking: &ldquo;Patient ko saans lene mein dikkat hai aur bukhar hai&rdquo;
                </p>
              </div>

              {/* Sample Utterance Shortcut */}
              <button
                type="button"
                onClick={() => {
                  speechService.setTranscript('Patient ko saans lene mein dikkat hai aur fever hai.');
                  speechService.speakFeedback('Patient ko saans lene mein dikkat hai aur fever hai.');
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-[#12304A] border border-slate-200 text-xs font-medium rounded-lg shrink-0 shadow-xs"
              >
                Insert Sample Hindi Audio
              </button>
            </div>

            {/* Transcript Area */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#12304A]">
                  Voice Transcript / Text Input Fallback
                </label>
                {speechState.transcript && (
                  <button
                    type="button"
                    onClick={() => speechService.clearTranscript()}
                    className="text-[11px] text-slate-500 hover:text-red-600 underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <textarea
                rows={3}
                value={speechState.transcript + (speechState.interimTranscript ? ` (${speechState.interimTranscript})` : '')}
                onChange={(e) => speechService.setTranscript(e.target.value)}
                placeholder="Recognized voice transcript will appear here. You can also type or edit directly..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#087F8C] bg-white font-medium"
              />
              {speechState.error && (
                <p className="text-[11px] text-amber-700 mt-1 bg-amber-50 p-2 rounded border border-amber-200">
                  {speechState.error}
                </p>
              )}
            </div>
          </div>

          {/* Vitals Collection Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#12304A] flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-red-600" />
                <span>Clinical Vitals Measurements</span>
              </h2>
              <p className="text-xs text-[#536779]">
                Frontline physical vitals measured using standard kit (Pulse Oximeter, Thermometer, BP Cuff)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* SpO2 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#12304A] flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#087F8C]" />
                    <span>Oxygen Saturation (SpO₂)</span>
                  </label>
                  <span className="text-[11px] text-[#536779]">%</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 89.0"
                  value={vitals.spo2 ?? ''}
                  onChange={(e) =>
                    setVitals({ ...vitals, spo2: e.target.value ? Number(e.target.value) : null })
                  }
                  className={`w-full px-3 py-2 text-sm font-bold border rounded-lg focus:outline-none ${
                    vitals.spo2 !== null && Number(vitals.spo2) < 90
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : 'border-slate-300 bg-white'
                  }`}
                />
                <span className="text-[10px] text-[#536779] block">
                  Normal: 95-100% • <strong className="text-red-600">&lt;90% Critical Emergency</strong>
                </span>
              </div>

              {/* Heart Rate */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#12304A] flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-red-500" />
                    <span>Heart Rate (Pulse)</span>
                  </label>
                  <span className="text-[11px] text-[#536779]">BPM</span>
                </div>
                <input
                  type="number"
                  placeholder="e.g. 112"
                  value={vitals.heart_rate ?? ''}
                  onChange={(e) =>
                    setVitals({ ...vitals, heart_rate: e.target.value ? Number(e.target.value) : null })
                  }
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 bg-white rounded-lg"
                />
                <span className="text-[10px] text-[#536779] block">
                  Normal: 60-100 BPM
                </span>
              </div>

              {/* Temperature */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#12304A] flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-amber-500" />
                    <span>Body Temperature</span>
                  </label>
                  <span className="text-[11px] text-[#536779]">°F</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 101.4"
                  value={vitals.temperature ?? ''}
                  onChange={(e) =>
                    setVitals({ ...vitals, temperature: e.target.value ? Number(e.target.value) : null })
                  }
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 bg-white rounded-lg"
                />
                <span className="text-[10px] text-[#536779] block">
                  Normal: 98.6°F • &gt;100.4°F Fever
                </span>
              </div>

              {/* Respiratory Rate */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#12304A] flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-sky-500" />
                    <span>Respiratory Rate</span>
                  </label>
                  <span className="text-[11px] text-[#536779]">breaths/min</span>
                </div>
                <input
                  type="number"
                  placeholder="e.g. 28"
                  value={vitals.respiratory_rate ?? ''}
                  onChange={(e) =>
                    setVitals({ ...vitals, respiratory_rate: e.target.value ? Number(e.target.value) : null })
                  }
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 bg-white rounded-lg"
                />
                <span className="text-[10px] text-[#536779] block">
                  Normal: 12-20 bpm • &ge;30 bpm Critical
                </span>
              </div>

              {/* Blood Pressure Systolic */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#12304A]">
                    Systolic BP (SBP)
                  </label>
                  <span className="text-[11px] text-[#536779]">mmHg</span>
                </div>
                <input
                  type="number"
                  placeholder="e.g. 142"
                  value={vitals.systolic_bp ?? ''}
                  onChange={(e) =>
                    setVitals({ ...vitals, systolic_bp: e.target.value ? Number(e.target.value) : null })
                  }
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 bg-white rounded-lg"
                />
                <span className="text-[10px] text-[#536779] block">
                  Normal: 100-120 mmHg
                </span>
              </div>

              {/* Blood Pressure Diastolic */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#12304A]">
                    Diastolic BP (DBP)
                  </label>
                  <span className="text-[11px] text-[#536779]">mmHg</span>
                </div>
                <input
                  type="number"
                  placeholder="e.g. 88"
                  value={vitals.diastolic_bp ?? ''}
                  onChange={(e) =>
                    setVitals({ ...vitals, diastolic_bp: e.target.value ? Number(e.target.value) : null })
                  }
                  className="w-full px-3 py-2 text-sm font-bold border border-slate-300 bg-white rounded-lg"
                />
                <span className="text-[10px] text-[#536779] block">
                  Normal: 60-80 mmHg
                </span>
              </div>
            </div>

            {/* ASHA Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#12304A] mb-1">
                ASHA Clinical Observations / Field Notes
              </label>
              <textarea
                rows={2}
                value={ashaNotes}
                onChange={(e) => setAshaNotes(e.target.value)}
                placeholder="Note any visible distress, posture, skin discoloration, or immediate home environment factors..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#087F8C]"
              />
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#536779] hover:text-[#12304A] bg-white border border-slate-200 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Patient Info</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#087F8C] hover:bg-[#066670] text-white font-semibold text-xs rounded-lg transition shadow-xs"
            >
              <span>Review Assessment Rules</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & EXECUTE CLINICAL ASSESSMENT */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-[#12304A]">Step 3: Clinical Rule Assessment Engine</h2>
            <p className="text-xs text-[#536779]">
              Deterministic MoHFW / NHM clinical rule execution. No black-box fabrication.
            </p>
          </div>

          {/* Summary Preview Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div className="space-y-2">
              <h3 className="font-bold text-[#12304A] uppercase tracking-wider text-[11px]">
                Patient Summary
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[#536779]">
                <div>Name: <strong className="text-[#12304A]">{fullName || 'Demo Patient'}</strong></div>
                <div>Age: <strong className="text-[#12304A]">{age || 58} yrs</strong></div>
                <div>Village: <strong className="text-[#12304A]">{village}</strong></div>
                <div>Sex: <strong className="text-[#12304A]">{sex}</strong></div>
              </div>
              <div>
                <span className="text-[#536779]">Active Symptoms: </span>
                <span className="font-semibold text-[#12304A]">
                  {selectedSymptoms.length > 0 ? selectedSymptoms.join(', ') : 'None selected'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-[#12304A] uppercase tracking-wider text-[11px]">
                Vitals Measured
              </h3>
              <div className="grid grid-cols-2 gap-2 text-[#536779]">
                <div>
                  SpO₂: <strong className={vitals.spo2 && Number(vitals.spo2) < 90 ? 'text-red-600 font-bold' : 'text-[#12304A]'}>
                    {vitals.spo2 !== null ? `${vitals.spo2}%` : 'Not recorded'}
                  </strong>
                </div>
                <div>
                  Pulse: <strong className="text-[#12304A]">{vitals.heart_rate ? `${vitals.heart_rate} bpm` : 'Not recorded'}</strong>
                </div>
                <div>
                  Temp: <strong className="text-[#12304A]">{vitals.temperature ? `${vitals.temperature}°F` : 'Not recorded'}</strong>
                </div>
                <div>
                  Resp Rate: <strong className="text-[#12304A]">{vitals.respiratory_rate ? `${vitals.respiratory_rate} bpm` : 'Not recorded'}</strong>
                </div>
              </div>
              {speechState.transcript && (
                <div className="text-[11px] text-[#536779] bg-white p-2 rounded border border-slate-200">
                  <strong>Voice Note:</strong> &ldquo;{speechState.transcript}&rdquo;
                </div>
              )}
            </div>
          </div>

          {/* Transparent Engine Rules Explanation */}
          <div className="p-4 bg-[#EAF4F8] rounded-xl border border-[#087F8C]/20 text-xs space-y-2">
            <h4 className="font-bold text-[#12304A] flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#087F8C]" />
              <span>Transparent Decision Support Architecture</span>
            </h4>
            <p className="text-[#536779] leading-relaxed">
              Upon clicking <strong>&ldquo;Execute Clinical Assessment&rdquo;</strong>, the rule engine checks for critical red-flag triggers (e.g., severe hypoxemia SpO₂ &lt; 90%, respiratory distress, gestational hypertension, shock index) and produces an explainable breakdown of risk points and care levels.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#536779] hover:text-[#12304A] bg-white border border-slate-200 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Vitals</span>
            </button>

            <button
              type="button"
              onClick={handleRunAssessment}
              disabled={isEvaluating}
              className="flex items-center gap-2 px-6 py-3 bg-[#087F8C] hover:bg-[#066670] text-white font-bold text-sm rounded-lg transition shadow-md"
            >
              {isEvaluating ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Evaluating Clinical Rules...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Clinical Assessment →</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: RESULT SCREEN & ROUTING */}
      {currentStep === 4 && assessmentResult && (
        <div className="space-y-6">
          {/* Main Risk Alert Banner */}
          <div
            className={`p-6 rounded-xl border shadow-sm ${
              assessmentResult.risk_category === 'HIGH'
                ? 'bg-red-50 border-red-300 text-red-950'
                : assessmentResult.risk_category === 'MODERATE'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-emerald-50 border-emerald-300 text-emerald-950'
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`p-3 rounded-full shrink-0 ${
                    assessmentResult.risk_category === 'HIGH'
                      ? 'bg-red-600 text-white emergency-pulse-badge'
                      : assessmentResult.risk_category === 'MODERATE'
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                      {assessmentResult.risk_category === 'HIGH'
                        ? 'CRITICAL HIGH RISK — IMMEDIATE ESCALATION'
                        : assessmentResult.risk_category === 'MODERATE'
                        ? 'MODERATE RISK — SAME DAY DOCTOR VISIT'
                        : 'LOW RISK — ROUTINE PRIMARY CARE'}
                    </h2>
                    <UrgencyPill urgency={assessmentResult.urgency} size="sm" />
                  </div>
                  <p className="text-xs mt-1 font-medium opacity-90">
                    Patient: {assessmentResult.patient_name} ({assessmentResult.patient_age} yrs, {assessmentResult.patient_village})
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setShowReferralModal(true)}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-[#12304A] hover:bg-[#0D2235] text-white font-bold text-xs rounded-lg transition shadow-xs"
                >
                  <Send className="w-4 h-4 text-[#F2B544]" />
                  <span>Create Referral</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2.5 bg-white text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition"
                  title="Print clinical triage slip"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Recommended Action Guidance Box */}
            <div className="mt-4 p-4 bg-white/90 rounded-lg border border-black/10 text-xs space-y-1.5">
              <span className="font-bold uppercase tracking-wider text-[10px] text-[#536779]">
                Recommended Clinical Action (Frontline Protocol)
              </span>
              <p className="font-semibold text-sm leading-relaxed text-[#12304A]">
                {assessmentResult.recommended_action}
              </p>
            </div>
          </div>

          {referralSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{referralSuccessMsg}</span>
            </div>
          )}

          {/* Triggered Red Flags & Feature Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Triggered Rules */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-[#12304A] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <span>Triggered Clinical Red Flags ({assessmentResult.triggered_rules.length})</span>
                </h3>
                <span className="text-[11px] text-[#536779]">Transparent Rationale</span>
              </div>

              {assessmentResult.triggered_rules.length > 0 ? (
                <div className="space-y-2.5">
                  {assessmentResult.triggered_rules.map((rule) => (
                    <div
                      key={rule.rule_id}
                      className="p-3 rounded-lg border border-red-200 bg-red-50/40 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-800">{rule.rule_name}</span>
                        <span className="text-[10px] bg-red-100 text-red-800 font-mono px-1.5 py-0.2 rounded font-semibold">
                          {rule.rule_id}
                        </span>
                      </div>
                      <p className="text-[11px] text-red-900/90 leading-relaxed">
                        {rule.clinical_rationale}
                      </p>
                      <div className="text-[10px] text-slate-600 pt-1">
                        Suggested Care Level: <strong className="text-[#12304A]">{rule.suggested_level}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg">
                  No emergency red flags triggered. Standard primary care pathway applies.
                </div>
              )}
            </div>

            {/* Feature Contributions Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-[#12304A] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#087F8C]" />
                  <span>Feature Contributions & Weights</span>
                </h3>
                <span className="text-[11px] text-[#536779]">
                  Total Risk Score: <strong>{assessmentResult.score} pts</strong>
                </span>
              </div>

              <div className="space-y-2">
                {assessmentResult.feature_contributions.map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#12304A]">{feat.feature_name}</div>
                      <div className="text-[11px] text-[#536779]">{feat.note}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-[#12304A]">{feat.value}</div>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                          feat.risk_impact === 'HIGH_RISK_TRIGGER'
                            ? 'bg-red-100 text-red-800'
                            : feat.risk_impact === 'MODERATE_RISK'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        +{feat.points_weight} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Destination Healthcare Facilities */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-bold text-[#12304A] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#087F8C]" />
                  <span>Matched Destination Healthcare Facilities</span>
                </h3>
                <p className="text-xs text-[#536779]">
                  Ranked by clinical capability match for {assessmentResult.recommended_care_level}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {assessmentResult.facility_options.map((fac) => (
                <div
                  key={fac.id}
                  className={`p-4 rounded-xl border text-xs space-y-2 flex flex-col justify-between ${
                    fac.id === 'FAC-DH-01'
                      ? 'border-[#087F8C] bg-[#EAF4F8]/40 ring-1 ring-[#087F8C]'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#087F8C] bg-white px-2 py-0.5 rounded border border-[#087F8C]/20">
                        {fac.facility_type}
                      </span>
                      <span className="text-[11px] font-bold text-[#12304A]">
                        {fac.distance_km} km ({fac.est_time})
                      </span>
                    </div>
                    <h4 className="font-bold text-[#12304A] text-xs pt-1">{fac.name}</h4>
                    <p className="text-[11px] text-[#536779]">{fac.match_reason}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px]">
                      {fac.emergency_ready && (
                        <span className="text-red-700 bg-red-100 px-1.5 py-0.2 rounded font-bold">
                          24/7 Emergency
                        </span>
                      )}
                      {fac.oxygen_supported && (
                        <span className="text-teal-800 bg-teal-100 px-1.5 py-0.2 rounded font-medium">
                          Oxygen
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFacilityId(fac.id);
                        setShowReferralModal(true);
                      }}
                      className="px-2.5 py-1 bg-[#087F8C] hover:bg-[#066670] text-white text-[11px] font-semibold rounded"
                    >
                      Select →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Row */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#536779] hover:text-[#12304A] bg-white border border-slate-200 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Edit Vitals / Symptoms</span>
            </button>

            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#12304A] font-semibold text-xs rounded-lg transition"
            >
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      )}

      {/* CREATE REFERRAL MODAL */}
      {showReferralModal && assessmentResult && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-[#087F8C]" />
                <h3 className="text-base font-bold text-[#12304A]">
                  Create Health Facility Referral
                </h3>
              </div>
              <button
                onClick={() => setShowReferralModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#EAF4F8] rounded-lg space-y-1">
                <div className="flex justify-between font-bold text-[#12304A]">
                  <span>Patient: {assessmentResult.patient_name}</span>
                  <RiskBadge risk={assessmentResult.risk_category} size="sm" />
                </div>
                <div className="text-[#536779]">
                  Urgency: <strong>{assessmentResult.urgency}</strong> • SpO₂: {assessmentResult.vitals.spo2 ?? 'N/A'}%
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#12304A] mb-1">
                  Destination Health Facility <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedFacilityId}
                  onChange={(e) => setSelectedFacilityId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="FAC-DH-01">District Hospital (DH) Civil Medical Center (14.2 km • 24/7 ICU & Oxygen)</option>
                  <option value="FAC-CHC-02">Community Health Centre (CHC) Rampur (6.5 km • 30-Bed)</option>
                  <option value="FAC-PHC-03">Primary Health Centre (PHC) Chandanpur (2.8 km • Daytime OPD)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#12304A] mb-1">
                  Transport Arrangement
                </label>
                <select
                  value={referralTransport}
                  onChange={(e) => setReferralTransport(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="108 Emergency Ambulance (Dispatched)">108 Emergency Ambulance (Dispatched)</option>
                  <option value="102 Janani Shishu Vahan">102 Janani Shishu Vahan (Maternal)</option>
                  <option value="Community Auto / Private Vehicle">Community Auto / Private Vehicle</option>
                  <option value="Self / Family Transport">Self / Family Transport</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#12304A] mb-1">
                  Clinical Transfer Notes & Handover Instructions
                </label>
                <textarea
                  rows={3}
                  value={referralNotes}
                  onChange={(e) => setReferralNotes(e.target.value)}
                  placeholder="e.g. Oxygen initiated at SHC. Transferred in semi-Fowler position. Informed MO Dr. Verma on mobile."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-[#087F8C]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReferralModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingReferral}
                onClick={handleCreateReferralSubmit}
                className="px-5 py-2 text-xs font-bold text-white bg-[#087F8C] hover:bg-[#066670] rounded-lg transition shadow-xs flex items-center gap-1.5"
              >
                {isSubmittingReferral ? (
                  <span>Generating Referral...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm & Route Referral</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AssessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Assessment Interface...</div>}>
      <AssessPatientContent />
    </Suspense>
  );
}
